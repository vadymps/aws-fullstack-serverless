# terraform {
#   backend "s3" {
#     bucket         = "aws-fullstack-serverless-tfstate"
#     key            = "terraform.tfstate"
#     region         = "eu-central-1"
#     dynamodb_table = "aws-fullstack-serverless-tflock"
#     encrypt        = true
#     profile        = "dev"
#   }
# }
