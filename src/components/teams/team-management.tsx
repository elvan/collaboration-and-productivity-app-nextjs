import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'invited';
}

interface TeamManagementProps {
  teamId: string;
  members: TeamMember[];
  onInviteMember: (email: string, role: string) => void;
  onUpdateMemberRole: (memberId: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function TeamManagement({ teamId, members, onInviteMember, onUpdateMemberRole, onRemoveMember }: TeamManagementProps) {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  const handleInvite = () => {
    if (newMemberEmail) {
      onInviteMember(newMemberEmail, newMemberRole);
      setNewMemberEmail('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Team Members</h2>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email to invite"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
          </div>
          <div className="w-32">
            <Label htmlFor="role">Role</Label>
            <Select
              value={newMemberRole}
              onValueChange={setNewMemberRole}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleInvite}>Invite Member</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value) => onUpdateMemberRole(member.id, value)}
                    disabled={member.status === 'invited'}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemoveMember(member.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
