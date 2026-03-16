import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Plus, Shield, Eye } from 'lucide-react';

const TEAM = [
  { name: 'Mr. Rohit', email: 'rohit@medsource.com', role: 'Admin', access: 'Full Access', initials: 'MR', color: 'bg-primary' },
  { name: 'Sales Team 1', email: 'sales1@medsource.com', role: 'Manager', access: 'View Only', initials: 'S1', color: 'bg-emerald-500' },
  { name: 'Support Agent', email: 'support@medsource.com', role: 'Agent', access: 'Chat Only', initials: 'SA', color: 'bg-amber-500' },
];

export function TeamPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage access and permissions</CardDescription>
          </div>
          <Button onClick={() => toast({ title: 'Coming Soon', description: 'Team management will be available with authentication.' })}>
            <Plus className="mr-2 h-4 w-4" />Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEAM.map((m) => (
                <TableRow key={m.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`${m.color} text-white text-xs`}>{m.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {m.role === 'Admin' ? <Shield className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.access}</TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
