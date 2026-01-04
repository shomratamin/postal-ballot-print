package constants

// UserRole enum
type UserRole string

const (
	SUPER_ADMIN UserRole = "SUPER_ADMIN"
	ADMIN       UserRole = "ADMIN"
	OPERATOR    UserRole = "OPERATOR"
)

// UserPermission enum
type UserPermission string

const (
	FULL_PERMIT UserPermission = "FULL_PERMIT"
)

// Role-based permissions
const (
	// Super Admin permissions
	PermSuperAdminFull = "SUPER_ADMIN.FULL_PERMIT"

	// Admin permissions
	PermAdminFull = "ADMIN.FULL_PERMIT"

	// Operator permissions
	PermOperatorFull = "OPERATOR.FULL_PERMIT"

	// Special permissions
	PermAny = "any"
)

// Permission groups for convenience
var (
	SuperAdminPermissions = []string{
		PermSuperAdminFull,
	}

	AdminPermissions = []string{
		PermAdminFull,
	}

	OperatorPermissions = []string{
		PermOperatorFull,
	}

	// All permissions for super admin access
	AllPermissions = []string{
		PermSuperAdminFull,
		PermAdminFull,
		PermOperatorFull,
	}
)
