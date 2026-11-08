# Legacy backend (Lambda + API Gateway). Kept only while Vercel still points to
# the API Gateway URL; destroyed with legacy_lambda_enabled = false. Once
# destroyed, delete this file, api_gateway.tf, infra/scripts/build_lambda.sh and
# mangum (requirements.txt + backend/main.py) together, including the moved blocks.

locals {
  lambda_zip = "${path.module}/../lambda_package.zip"
}

resource "aws_iam_role" "lambda" {
  count = var.legacy_lambda_enabled ? 1 : 0

  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  count = var.legacy_lambda_enabled ? 1 : 0

  role       = aws_iam_role.lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3" {
  count = var.legacy_lambda_enabled ? 1 : 0

  name = "${local.name_prefix}-lambda-s3-policy"
  role = aws_iam_role.lambda[0].id

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
    ]
  })
}

resource "aws_lambda_function" "api" {
  count = var.legacy_lambda_enabled ? 1 : 0

  function_name = "${local.name_prefix}-api"
  filename      = local.lambda_zip
  # Terraform detects code changes via this hash and updates the function automatically.
  # The guard matters: count = 0 alone does not stop Terraform from reading the zip.
  source_code_hash = var.legacy_lambda_enabled ? filebase64sha256(local.lambda_zip) : null

  # Handler path: backend/main.py exports `handler = Mangum(app)`
  handler = "backend.main.handler"
  runtime = "python3.12"
  role    = aws_iam_role.lambda[0].arn

  memory_size                    = 256
  timeout                        = 30
  reserved_concurrent_executions = 2

  environment {
    variables = {
      S3_BUCKET      = aws_s3_bucket.catalog.bucket
      ADMIN_EMAIL    = var.admin_email
      ADMIN_PASSWORD = var.admin_password
      SECRET_KEY     = var.secret_key
      CORS_ORIGINS   = var.cors_origins
    }
  }

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_logs]
}

resource "aws_cloudwatch_log_group" "lambda" {
  count = var.legacy_lambda_enabled ? 1 : 0

  name              = "/aws/lambda/${aws_lambda_function.api[0].function_name}"
  retention_in_days = 14

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

moved {
  from = aws_iam_role.lambda
  to   = aws_iam_role.lambda[0]
}

moved {
  from = aws_iam_role_policy_attachment.lambda_logs
  to   = aws_iam_role_policy_attachment.lambda_logs[0]
}

moved {
  from = aws_iam_role_policy.lambda_s3
  to   = aws_iam_role_policy.lambda_s3[0]
}

moved {
  from = aws_lambda_function.api
  to   = aws_lambda_function.api[0]
}

moved {
  from = aws_cloudwatch_log_group.lambda
  to   = aws_cloudwatch_log_group.lambda[0]
}
