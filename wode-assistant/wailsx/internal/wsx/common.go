package wsx

type SysProcAttr struct {
	HideWindow    bool
	CmdLine       string // used if non-empty, else the windows command line is built by escaping the arguments passed to StartProcess
	CreationFlags uint32
	Token         uintptr // if set, runs new process in the security context represented by the token
	//ProcessAttributes          *SecurityAttributes // if set, applies these security attributes as the descriptor for the new process
	//ThreadAttributes           *SecurityAttributes // if set, applies these security attributes as the descriptor for the main thread of the new process
	NoInheritHandles           bool      // if set, no handles are inherited by the new process, not even the standard handles, contained in ProcAttr.Files, nor the ones contained in AdditionalInheritedHandles
	AdditionalInheritedHandles []uintptr // a list of additional handles, already marked as inheritable, that will be inherited by the new process
	ParentProcess              uintptr   // if non-zero, the new process regards the process given by this handle as its parent process, and AdditionalInheritedHandles, if set, should exist in this parent process
}

/*
type SecurityAttributes struct {
	Length             uint32
	SecurityDescriptor uintptr
	InheritHandle      uint32
}
*/
