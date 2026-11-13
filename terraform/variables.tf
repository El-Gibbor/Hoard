variable "subscription_id" {
  description = "Azure subscription to deploy into. Run `az account show --query id -o tsv` to get yours."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.subscription_id))
    error_message = "subscription_id must be a subscription GUID."
  }
}

variable "prefix" {
  description = "Short name that starts every resource name, unique per person (e.g. hoard-eke)."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,18}[a-z0-9]$", var.prefix))
    error_message = "prefix must be 4-20 characters of lowercase letters, digits and hyphens, starting with a letter."
  }
}

variable "location" {
  description = "Azure region to deploy into (e.g. southafricanorth). Some student subscriptions only allow certain regions."
  type        = string
}

variable "vm_size" {
  description = "Size of the application VM."
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Login user created on the VM."
  type        = string
  default     = "hoard"

  validation {
    condition     = !contains(["admin", "administrator", "root", "azureuser"], var.admin_username)
    error_message = "admin_username cannot be a reserved or commonly attacked name."
  }
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key allowed to log in to the VM."
  type        = string
  default     = "~/.ssh/hoard.pub"
}

variable "admin_ip" {
  description = "Your public IP in CIDR form (e.g. 203.0.113.10/32). SSH is only allowed from here."
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_ip, 0)) && var.admin_ip != "0.0.0.0/0"
    error_message = "admin_ip must be a CIDR block such as 203.0.113.10/32, and not 0.0.0.0/0."
  }
}

variable "tags" {
  description = "Extra tags added to every resource."
  type        = map(string)
  default     = {}
}
