export interface LdapRequest {
  connection: {
    ldap: {
      bindDN: {
        equals: (dn: string) => boolean;
      };
    };
  };
  dn: string;
}

// Represents an LDAP Add Request
export interface AddRequest {
  entry: any; // Should be detailed according to the specific structure expected for LDAP entries
  attributes: Array<Attribute>; // Detailed attribute array
  toObject(): {
    dn: string; // The Distinguished Name for the entry
    attributes: Record<string, string[]>; // Map of attribute names to their values
  };
}

// Represents an LDAP Bind Request
export interface BindRequest extends LdapRequest {
  version: number; // LDAP protocol version, typically 3
  name: string; // The DN (Distinguished Name) of the user attempting to bind
  authentication: string; // Authentication mechanism, e.g., 'simple'
  credentials: string | Buffer; // Credentials used for binding, format depends on the auth method
}

// Represents an LDAP Search Request
export interface SearchRequest {
  dn: string; // The DN of the entry to use as the search base
  baseObject: string; // =dn
  scope: 'base' | 'one' | 'sub'; // Scope of the search
  derefAliases: number; // Policy for dereferencing aliases
  sizeLimit: number; // Maximum number of entries to return
  timeLimit: number; // Time limit (in seconds) for the search
  typesOnly: boolean; // Return only attribute types, not values
  filter: Filter; // Search filter
  attributes: string[]; // Specific attributes to return
}

// Represents a generic LDAP Filter
export interface Filter {
  toString(): string; // String representation of the filter
  matches(attributes: Record<string, any>): boolean; // Checks if attributes match the filter
}

// Callback function type for LDAP operations
export interface LdapNext {
  (): void; // Indicates completion
  (error: any): void; // Indicates an error
}

// Represents an LDAP Modify Request
export interface ModifyRequest {
  dn: string; // The DN of the entry to modify
  changes: Array<Change>; // Changes to apply
}

// Represents a single modification operation
export interface Change {
  operation: 'add' | 'delete' | 'replace'; // Modification operation type
  modification: Attribute; // The attribute being modified
}

// Detailed Attribute type
export interface Attribute {
  type: string; // Type of the attribute
  vals: string[]; // Values of the attribute
}

// Represents an LDAP Delete Request
export interface DeleteRequest {
  dn: string; // The DN of the entry to delete
}

// Represents an LDAP Compare Request
export interface CompareRequest {
  dn: string; // The DN of the entry for comparison
  attribute: string; // The attribute to compare
  value: string; // The value to compare against the entry's attribute value
}

// Represents an LDAP Modify DN Request
export interface ModifyDNRequest {
  dn: string; // Current DN of the entry
  newRdn: string; // New RDN for the entry
  deleteOldRdn: boolean; // Whether to remove the old RDN
  newSuperior?: string; // New parent DN if moving the entry
}

export interface LdapResponse {
  send: (obj: any) => void;
  end: () => void;
}

export interface UnbindRequest extends LdapRequest {}

export interface BindResponse extends LdapResponse {}

export interface UnbindResponse extends LdapResponse {}

export interface ExtendedRequest extends LdapRequest {
  name: string;
  value: string;
}

export interface ExtendedResponse extends LdapResponse {
  name: string;
  value: string;
}
