locals {
  lambda_zip = "${path.module}/../lambda_package.zip"
}

resource "aws_lambda_function" "api" {
  function_name = "${local.name_prefix}-api"
  filename      = local.lambda_zip
  # Terraform detects code changes via this hash and updates the function automatically
  source_code_hash = filebase64sha256(local.lambda_zip)

  # Handler path: backend/main.py exports `handler = Mangum(app)`
  handler = "backend.main.handler"
  runtime = "python3.12"
  role    = aws_iam_role.lambda.arn

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
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 14

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}
