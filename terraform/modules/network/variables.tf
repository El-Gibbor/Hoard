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

variable "subnets" {
  description = "Subnets keyed by name, each with its own NSG. Inbound rules not listed are denied, apart from Azure's defaults for traffic inside the VNet and from the load balancer."
  type = map(object({
    address_prefix    = string
    delegation        = optional(string)
    service_endpoints = optional(list(string), [])
    inbound_rules = optional(map(object({
      priority = number
      port     = string
      source   = string
      access   = optional(string, "Allow")
    })), {})
  }))

  validation {
    condition = alltrue(flatten([
      for s in values(var.subnets) : [for r in values(s.inbound_rules) : r.port != "22" || !contains(["*", "Internet", "0.0.0.0/0"], r.source)]
    ]))
    error_message = "SSH (port 22) cannot be open to every address."
  }
}

variable "tags" {
  description = "Tags added to every resource."
  type        = map(string)
}
