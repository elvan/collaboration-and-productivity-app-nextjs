"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { TemplateBranch, TemplateVersion, User } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GitBranch,
  GitMerge,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"

interface ExtendedBranch extends TemplateBranch {
  createdBy: User
  _count: {
    versions: number
  }
}

interface BranchManagementProps {
  workspaceId: string
  templateId: string
  initialBranches: ExtendedBranch[]
}

export function BranchManagement({
  workspaceId,
  templateId,
  initialBranches,
}: BranchManagementProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [branches, setBranches] = useState<ExtendedBranch[]>(initialBranches)
  const [newBranch, setNewBranch] = useState({
    name: "",
    description: "",
    sourceBranch: "",
  })
  const [mergeBranch, setMergeBranch] = useState({
    sourceBranch: "",
    targetBranch: "",
  })
  const [showNewBranchDialog, setShowNewBranchDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [mergeConflicts, setMergeConflicts] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  async function fetchBranches() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/branches`
      )
      if (!response.ok) throw new Error("Failed to fetch branches")
      const data = await response.json()
      setBranches(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch branches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBranch() {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/branches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBranch),
        }
      )

      if (!response.ok) throw new Error("Failed to create branch")

      const createdBranch = await response.json()
      setBranches((prev) => [...prev, createdBranch])
      setShowNewBranchDialog(false)
      setNewBranch({ name: "", description: "", sourceBranch: "" })

      toast({
        title: "Success",
        description: "Branch created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create branch",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteBranch(branchId: string) {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/branches/${branchId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Failed to delete branch")

      setBranches((prev) => prev.filter((branch) => branch.id !== branchId))
      toast({
        title: "Success",
        description: "Branch deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      })
    }
  }

  async function handleCheckMerge() {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/branches/merge-check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mergeBranch),
        }
      )

      if (!response.ok) throw new Error("Failed to check merge")

      const { conflicts } = await response.json()
      setMergeConflicts(conflicts)

      if (!conflicts) {
        handleMergeBranch()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check merge",
        variant: "destructive",
      })
    }
  }

  async function handleMergeBranch() {
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/templates/${templateId}/branches/merge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...mergeBranch,
            resolution: mergeConflicts,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to merge branch")

      await fetchBranches()
      setShowMergeDialog(false)
      setMergeBranch({ sourceBranch: "", targetBranch: "" })
      setMergeConflicts(null)

      toast({
        title: "Success",
        description: "Branches merged successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to merge branches",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Branches...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Branch Management</CardTitle>
            <CardDescription>
              Manage and organize template versions
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog
              open={showMergeDialog}
              onOpenChange={setShowMergeDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <GitMerge className="h-4 w-4 mr-2" />
                  Merge Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Merge Branches</DialogTitle>
                  <DialogDescription>
                    Select the source and target branches to merge
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label>Source Branch</label>
                    <Select
                      value={mergeBranch.sourceBranch}
                      onValueChange={(value) =>
                        setMergeBranch((prev) => ({
                          ...prev,
                          sourceBranch: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label>Target Branch</label>
                    <Select
                      value={mergeBranch.targetBranch}
                      onValueChange={(value) =>
                        setMergeBranch((prev) => ({
                          ...prev,
                          targetBranch: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {mergeConflicts && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-yellow-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Merge Conflicts Detected</span>
                      </div>
                      <ScrollArea className="h-[200px] border rounded-md p-4">
                        <pre className="text-sm">
                          {JSON.stringify(mergeConflicts, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMergeDialog(false)
                      setMergeConflicts(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={mergeConflicts ? handleMergeBranch : handleCheckMerge}
                  >
                    {mergeConflicts ? "Confirm Merge" : "Check & Merge"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={showNewBranchDialog}
              onOpenChange={setShowNewBranchDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Branch</DialogTitle>
                  <DialogDescription>
                    Create a new branch from an existing one
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label>Branch Name</label>
                    <Input
                      value={newBranch.name}
                      onChange={(e) =>
                        setNewBranch((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter branch name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Description</label>
                    <Textarea
                      value={newBranch.description}
                      onChange={(e) =>
                        setNewBranch((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter branch description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Source Branch</label>
                    <Select
                      value={newBranch.sourceBranch}
                      onValueChange={(value) =>
                        setNewBranch((prev) => ({
                          ...prev,
                          sourceBranch: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewBranchDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBranch}>Create Branch</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Versions</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-4 w-4" />
                    <span>{branch.name}</span>
                    {branch.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{branch.description}</TableCell>
                <TableCell>{branch._count.versions}</TableCell>
                <TableCell>{branch.createdBy.name}</TableCell>
                <TableCell>
                  {format(new Date(branch.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {!branch.isDefault && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this branch? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteBranch(branch.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
