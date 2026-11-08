# Legacy entry point for the Lambda backend. See the note at the top of lambda.tf.

resource "aws_apigatewayv2_api" "http" {
  count = var.legacy_lambda_enabled ? 1 : 0

  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins     = var.cors_origins != "" ? split(",", var.cors_origins) : ["*"]
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers     = ["Content-Type", "Authorization", "Cookie"]
    expose_headers    = ["Set-Cookie"]
    allow_credentials = var.cors_origins != ""
    max_age           = 300
  }

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  count = var.legacy_lambda_enabled ? 1 : 0

  api_id                 = aws_apigatewayv2_api.http[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  count = var.legacy_lambda_enabled ? 1 : 0

  api_id    = aws_apigatewayv2_api.http[0].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda[0].id}"
}

resource "aws_apigatewayv2_stage" "default" {
  count = var.legacy_lambda_enabled ? 1 : 0

  api_id      = aws_apigatewayv2_api.http[0].id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 2
  }

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

# Allow API Gateway to invoke the Lambda function
resource "aws_lambda_permission" "api_gateway" {
  count = var.legacy_lambda_enabled ? 1 : 0

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http[0].execution_arn}/*/*"
}

moved {
  from = aws_apigatewayv2_api.http
  to   = aws_apigatewayv2_api.http[0]
}

moved {
  from = aws_apigatewayv2_integration.lambda
  to   = aws_apigatewayv2_integration.lambda[0]
}

moved {
  from = aws_apigatewayv2_route.default
  to   = aws_apigatewayv2_route.default[0]
}

moved {
  from = aws_apigatewayv2_stage.default
  to   = aws_apigatewayv2_stage.default[0]
}

moved {
  from = aws_lambda_permission.api_gateway
  to   = aws_lambda_permission.api_gateway[0]
}
