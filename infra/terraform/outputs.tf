output "api_url" {
  description = "Public URL of the always-on API — set this as API_URL in Vercel"
  value       = "https://${local.api_domain}"
}

output "api_domain" {
  description = "Hostname served by Caddy. With a custom domain, point its A record to api_public_ip."
  value       = local.api_domain
}

output "api_public_ip" {
  description = "Elastic IP of the API instance"
  value       = aws_eip.api.public_ip
}

output "api_instance_id" {
  description = "EC2 instance that runs the API (target of SSM deploys)"
  value       = aws_instance.api.id
}

output "api_parameter_prefix" {
  description = "SSM parameter prefix read by infra/scripts/server_install.sh"
  value       = "/${local.name_prefix}/api"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket used to persist catalog.json, uploads and releases"
  value       = aws_s3_bucket.catalog.bucket
}