output "api_gateway_url" {
  description = "Public URL of the API Gateway — set this as API_URL in Vercel environment variables"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "lambda_function_name" {
  description = "Name of the deployed Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket used to persist catalog.json"
  value       = aws_s3_bucket.catalog.bucket
}
