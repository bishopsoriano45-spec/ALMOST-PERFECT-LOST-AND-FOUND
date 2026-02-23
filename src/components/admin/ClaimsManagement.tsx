import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Claim {
  id: number;
  lost_item_id: number;
  found_item_id: number;
  claimer_id: string;
  claimer_email: string;
  status: 'pending' | 'approved' | 'rejected';
  match_score: number;
  verification_notes: string;
  created_at: string;
  lost_item_title: string;
  found_item_title: string;
  lost_item_image?: string;
  found_item_image?: string;
}

export default function ClaimsManagement() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processingClaim, setProcessingClaim] = useState<Claim | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [deleteClaimId, setDeleteClaimId] = useState<number | null>(null);

  useEffect(() => {
    loadClaims();
  }, [filter]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`/api/admin/claims?status=${filter}`, config);
      setClaims(response.data);
    } catch (error) {
      console.error('Error loading claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessClaim = async (claimId: number, decision: 'approved' | 'rejected', notes: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post(`/api/admin/claims/${claimId}/process`, {
        decision,
        notes
      }, config);

      toast.success(`Claim ${decision} successfully`);
      setProcessingClaim(null); // Clear processing claim
      setAdminNotes(''); // Clear notes
      loadClaims(); // Reload to update list
    } catch (error) {
      console.error('Error processing claim:', error);
      toast.error('Failed to process claim');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const handleDeleteClaim = async (claimId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.delete(`/api/admin/claims/${claimId}`, config);
      toast.success('Claim deleted successfully');
      setDeleteClaimId(null);
      loadClaims();
    } catch (error) {
      console.error('Error deleting claim:', error);
      toast.error('Failed to delete claim');
      setDeleteClaimId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Claims Management</CardTitle>
            <CardDescription>Review and process ownership claims</CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claims</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No claims found.</div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">Claim #{claim.id}</span>
                    {getStatusBadge(claim.status)}
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Claimer:</span> {claim.claimer_email}
                    </div>
                    {claim.lost_item_id && (
                      <div className="flex items-center gap-2">
                        {claim.lost_item_image && (
                          <img src={claim.lost_item_image} alt="Lost" className="w-8 h-8 rounded object-cover border" />
                        )}
                        <span className="font-medium">Lost Item:</span> {claim.lost_item_title}
                      </div>
                    )}
                    {claim.found_item_id && (
                      <div className="flex items-center gap-2">
                        {claim.found_item_image && (
                          <img src={claim.found_item_image} alt="Found" className="w-8 h-8 rounded object-cover border" />
                        )}
                        <span className="font-medium">Found Item:</span> {claim.found_item_title}
                      </div>
                    )}
                  </div>

                  {claim.verification_notes && (
                    <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mt-2">
                      <MessageSquare className="w-3 h-3 inline mr-1 text-gray-400" />
                      User Note: {claim.verification_notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Claim Details #{claim.id}</DialogTitle>
                        <DialogDescription>Review full details before making a decision.</DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-500">Lost Item</h4>
                          {claim.lost_item_image ? (
                            <img src={claim.lost_item_image} alt="Lost Item" className="w-full h-40 object-cover rounded-md border" />
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">No Image</div>
                          )}
                          <p className="text-sm font-medium">{claim.lost_item_title}</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-500">Found Item</h4>
                          {claim.found_item_image ? (
                            <img src={claim.found_item_image} alt="Found Item" className="w-full h-40 object-cover rounded-md border" />
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">No Image</div>
                          )}
                          <p className="text-sm font-medium">{claim.found_item_title}</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-blue-900">AI Match Score</span>
                          <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                            {Math.round((claim.match_score || 0) * 100)}% Match
                          </Badge>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(claim.match_score || 0) * 100}%` }}></div>
                        </div>
                      </div>

                      {claim.status === 'pending' && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="font-medium">Admin Action</h4>
                          <Textarea
                            placeholder="Add notes explaining your decision..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                          />
                          <div className="flex gap-3 justify-end">
                            <Button
                              variant="destructive"
                              onClick={() => { setProcessingClaim(claim); handleProcessClaim(claim.id, 'rejected', adminNotes); }}
                            >
                              Reject Claim
                            </Button>
                            <Button
                              onClick={() => { setProcessingClaim(claim); handleProcessClaim(claim.id, 'approved', adminNotes); }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve Claim
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Delete Button with Confirmation Modal */}
                  <Dialog open={deleteClaimId === claim.id} onOpenChange={(open) => !open && setDeleteClaimId(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteClaimId(claim.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Claim #{claim.id}?</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this claim? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setDeleteClaimId(null)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteClaim(claim.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}