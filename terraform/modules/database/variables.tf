variable "prefix" {
  description = "Starts every resource name."
  type        = string
}

variable "location" {
  description = "Azure region for the server."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group to create the server in."
  type        = string
}

variable "vnet_id" {
  description = "Virtual network linked to the private DNS zone, so the app resolves the server's name."
  type        = string
}

variable "subnet_id" {
  description = "Subnet delegated to PostgreSQL Flexible Server."
  type        = string
}

variable "sku_name" {
  description = "Server size."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "admin_username" {
  description = "Administrator login the app connects as."
  type        = string
  default     = "hoard"
}

variable "database_name" {
  description = "Database the app uses."
  type        = string
  default     = "hoard"
}

variable "tags" {
  description = "Tags added to every resource."
  type        = map(string)
}
