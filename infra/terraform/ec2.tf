# Always-on API: FastAPI (uvicorn) behind Caddy on a single ARM instance.
# Software is installed and updated by infra/scripts/server_install.sh through
# SSM on every deploy, so the instance itself carries no user_data.

data "aws_vpc" "default" {
  default = true
}

data "aws_ec2_instance_type_offerings" "api" {
  location_type = "availability-zone"

  filter {
    name   = "instance-type"
    values = [var.api_instance_type]
  }
}

data "aws_subnets" "api" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }

  filter {
    name   = "availability-zone"
    values = data.aws_ec2_instance_type_offerings.api.locations
  }
}

data "aws_ami" "al2023_arm64" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-*-arm64"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }
}

resource "aws_security_group" "api" {
  name        = "${local.name_prefix}-api"
  description = "Public HTTP/HTTPS for Caddy. No SSH: access goes through SSM."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP (ACME challenge and redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "S3, SSM, package repositories and Lets Encrypt"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

resource "aws_eip" "api" {
  domain = "vpc"

  tags = {
    Name        = "${local.name_prefix}-api"
    Project     = var.project_name
    Environment = local.environment
  }
}

locals {
  api_domain = var.api_domain != "" ? var.api_domain : "${replace(aws_eip.api.public_ip, ".", "-")}.sslip.io"

  # systemd EnvironmentFile: values are double-quoted, so escape \ and "
  api_env = {
    S3_BUCKET          = aws_s3_bucket.catalog.bucket
    ADMIN_EMAIL        = var.admin_email
    ADMIN_PASSWORD     = var.admin_password
    SECRET_KEY         = var.secret_key
    CORS_ORIGINS       = var.cors_origins
    AWS_REGION         = var.aws_region
    AWS_DEFAULT_REGION = var.aws_region
  }
  api_env_file = join("\n", [
    for key, value in local.api_env :
    "${key}=\"${replace(replace(value, "\\", "\\\\"), "\"", "\\\"")}\""
  ])
}

resource "aws_ssm_parameter" "api_env" {
  name        = "/${local.name_prefix}/api/env"
  description = "EnvironmentFile for the amishi-api systemd service"
  type        = "SecureString"
  value       = local.api_env_file

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

resource "aws_ssm_parameter" "api_domain" {
  name        = "/${local.name_prefix}/api/domain"
  description = "Hostname served by Caddy"
  type        = "String"
  value       = local.api_domain

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

resource "aws_instance" "api" {
  ami                    = data.aws_ami.al2023_arm64.id
  instance_type          = var.api_instance_type
  subnet_id              = sort(data.aws_subnets.api.ids)[0]
  vpc_security_group_ids = [aws_security_group.api.id]
  iam_instance_profile   = aws_iam_instance_profile.api.name

  # Standard credits cap the CPU bill; unlimited mode can add surprise charges.
  credit_specification {
    cpu_credits = "standard"
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  tags = {
    Name        = "${local.name_prefix}-api"
    Project     = var.project_name
    Environment = local.environment
  }

  # A newer AMI or a different default subnet must not replace the running server.
  lifecycle {
    ignore_changes = [ami, subnet_id]
  }
}

resource "aws_eip_association" "api" {
  instance_id   = aws_instance.api.id
  allocation_id = aws_eip.api.id
}
