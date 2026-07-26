resource "aws_s3_bucket" "catalog" {
  bucket = "${local.name_prefix}-catalog"

  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

resource "aws_s3_bucket_public_access_block" "catalog" {
  bucket = aws_s3_bucket.catalog.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "catalog" {
  bucket = aws_s3_bucket.catalog.id

  versioning_configuration {
    status = "Enabled"
  }
}
