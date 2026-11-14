variable "prefix" {
  description = "Starts every resource name."
  type        = string
}

variable "location" {
  description = "Azure region for the resource group and network."
  type        = string
}

variable "address_space" {
  description = "Address range of the virtual network."
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_prefix" {
  description = "Address range of the subnet the VM joins."
  type        = string
  default     = "10.0.1.0/24"
}

variable "inbound_rules" {
  description = "Inbound TCP rules, keyed by rule name. Anything not listed is denied."
  type = map(object({
    priority = number
    port     = string
    source   = string
  }))

  validation {
    condition     = alltrue([for r in values(var.inbound_rules) : r.port != "22" || r.source != "*"])
    error_message = "SSH (port 22) cannot be open to every address."
  }
}

variable "tags" {
  description = "Tags added to every resource."
  type        = map(string)
}
