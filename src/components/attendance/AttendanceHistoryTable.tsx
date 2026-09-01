import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Calendar, Clock, Edit2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import type { AttendanceRecord } from '@/types/attendance';
import { format } from 'date-fns';

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  onEditRecord?: (record: AttendanceRecord) => void;
}

export function AttendanceHistoryTable({ records, isLoading, onEditRecord }: AttendanceHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.staff_email && r.staff_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.branch?.name && r.branch.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'all' || r.status === selectedStatus;

    const matchesDate =
      !selectedDate || r.clock_in_time.startsWith(selectedDate);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'Staff Name',
      'Email',
      'Branch',
      'Clock In Time',
      'Clock Out Time',
      'Total Minutes',
      'Total Hours',
      'Status',
      'Notes',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.staff_name}"`,
      `"${r.staff_email || ''}"`,
      `"${r.branch?.name || 'Main Branch'}"`,
      `"${format(new Date(r.clock_in_time), 'yyyy-MM-dd HH:mm:ss')}"`,
      r.clock_out_time ? `"${format(new Date(r.clock_out_time), 'yyyy-MM-dd HH:mm:ss')}"` : '""',
      r.total_minutes || 0,
      r.total_minutes ? (r.total_minutes / 60).toFixed(2) : '0',
      `"${r.status}"`,
      `"${r.clock_out_notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `staff_attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border border-border/80 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Attendance Logs & Timesheets</CardTitle>
            <CardDescription className="text-xs">
              Complete historical record of staff shifts and working hours
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-1.5 h-8 text-xs self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search staff, email, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/20"
            />
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 text-xs bg-muted/20"
          />

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 text-xs rounded-md border border-input bg-muted/20 px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="on_duty">Active (On Duty)</option>
            <option value="on_break">On Break</option>
            <option value="completed">Completed Shift</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
                <TableHead className="py-2.5 font-semibold text-foreground">Staff Member</TableHead>
                <TableHead className="py-2.5 font-semibold text-foreground">Station / Branch</TableHead>
                <TableHead className="py-2.5 font-semibold text-foreground">Clock In</TableHead>
                <TableHead className="py-2.5 font-semibold text-foreground">Clock Out</TableHead>
                <TableHead className="py-2.5 font-semibold text-foreground">Hours Logged</TableHead>
                <TableHead className="py-2.5 font-semibold text-foreground">Status</TableHead>
                <TableHead className="py-2.5 font-semibold text-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Loading attendance records...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    No attendance sessions found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const isCompleted = record.status === 'completed';
                  const durationHours = record.total_minutes
                    ? (record.total_minutes / 60).toFixed(1) + ' hrs'
                    : '--';

                  return (
                    <TableRow key={record.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="py-3 font-medium">
                        <div>
                          <span className="font-semibold text-foreground">{record.staff_name}</span>
                          {record.staff_email && (
                            <span className="block text-[11px] text-muted-foreground">
                              {record.staff_email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {record.branch?.name || 'Main Branch'}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-mono text-[11px] text-foreground">
                          {format(new Date(record.clock_in_time), 'MMM d, hh:mm a')}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {record.clock_out_time ? (
                          <div className="font-mono text-[11px] text-foreground">
                            {format(new Date(record.clock_out_time), 'MMM d, hh:mm a')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">In progress</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 font-mono font-medium text-foreground">
                        {durationHours}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.2 capitalize ${
                            record.status === 'on_duty'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : record.status === 'on_break'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {onEditRecord && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEditRecord(record)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
