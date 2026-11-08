resource "aws_iam_role" "api" {
  name = "${local.name_prefix}-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

# Lets GitHub Actions deploy through SSM Run Command instead of SSH
resource "aws_iam_role_policy_attachment" "api_ssm" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Catalog, uploaded images, password hash and release bundles live in the bucket;
# the API settings come from its own SSM parameters.
resource "aws_iam_role_policy" "api" {
  name = "${local.name_prefix}-api-policy"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
        ]
        Resource = "${aws_s3_bucket.catalog.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.catalog.arn
      },
      {
        Effect = "Allow"
        Action = ["ssm:GetParameter"]
        Resource = [
          aws_ssm_parameter.api_env.arn,
          aws_ssm_parameter.api_domain.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_instance_profile" "api" {
  name = "${local.name_prefix}-api-profile"
  role = aws_iam_role.api.name

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}
