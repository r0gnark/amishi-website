# Runs without AWS credentials: terraform init -backend=false && terraform test

mock_provider "aws" {
  override_data {
    target = data.aws_vpc.default
    values = { id = "vpc-default" }
  }

  override_data {
    target = data.aws_ec2_instance_type_offerings.api
    values = { locations = ["us-east-1a", "us-east-1b"] }
  }

  override_data {
    target = data.aws_subnets.api
    values = { ids = ["subnet-b", "subnet-a"] }
  }

  override_data {
    target = data.aws_ami.al2023_arm64
    values = { id = "ami-al2023-arm64" }
  }

  override_resource {
    target = aws_eip.api
    values = { public_ip = "1.2.3.4" }
  }
}

variables {
  environment    = "prod"
  admin_email    = "admin@amishi.cl"
  admin_password = "p\"a$s\\x"
  secret_key     = "secret"
  cors_origins   = "https://amishi.vercel.app"
}

run "api_instance" {
  command = apply

  assert {
    condition     = aws_instance.api.instance_type == "t4g.nano"
    error_message = "The API must run on a t4g.nano"
  }

  assert {
    condition     = aws_instance.api.credit_specification[0].cpu_credits == "standard"
    error_message = "Unlimited CPU credits can add unexpected charges"
  }

  assert {
    condition     = aws_instance.api.subnet_id == "subnet-a"
    error_message = "The subnet choice must be deterministic"
  }

  assert {
    condition     = toset([for rule in aws_security_group.api.ingress : rule.from_port]) == toset([80, 443])
    error_message = "Only HTTP and HTTPS may be open; SSH goes through SSM"
  }

  assert {
    condition     = output.api_url == "https://1-2-3-4.sslip.io"
    error_message = "Without api_domain the API must use the Elastic IP on sslip.io"
  }

  assert {
    condition     = strcontains(aws_ssm_parameter.api_env.value, "ADMIN_PASSWORD=\"p\\\"a$s\\\\x\"")
    error_message = "Secrets must be escaped for systemd EnvironmentFile"
  }

  assert {
    condition     = aws_ssm_parameter.api_env.type == "SecureString"
    error_message = "The API environment holds secrets"
  }

  assert {
    condition     = aws_ssm_parameter.api_env.name == "/amishi/api/env"
    error_message = "Production parameters must live under /amishi/api"
  }
}

run "custom_api_domain" {
  command = apply

  variables {
    api_domain = "api.amishi.cl"
  }

  assert {
    condition     = output.api_url == "https://api.amishi.cl"
    error_message = "api_domain must define the public API URL"
  }

  assert {
    condition     = aws_ssm_parameter.api_domain.value == "api.amishi.cl"
    error_message = "Caddy must serve the configured domain"
  }
}
