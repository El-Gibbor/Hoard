terraform {
  required_version = ">= 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Settings come from backend.hcl, written by bootstrap.sh: terraform init -backend-config=backend.hcl
  backend "azurerm" {}
}
