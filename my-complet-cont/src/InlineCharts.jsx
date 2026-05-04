import { Card, Row, Col } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie,
} from 'recharts';

const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLORS = {
  'Finished':    '#198754',
  'In Progress': '#FF6B00',
  'Not Started': '#0077b6',
};

const EMPLOYEE_COLORS = ['#FF6B00', '#0077b6', '#198754', '#f59e0b', '#0ea5e9', '#e63946'];

function InlineCharts({ entries, selectedMonth, selectedYear }) {
  const monthEntries = entries.filter(
    e => e.periodMonth === selectedMonth && e.periodYear === selectedYear
  );
  const yearEntries = entries.filter(e => e.periodYear === selectedYear);
  const employees = [...new Set(entries.map(e => e.employee))].sort();

  const statusData = [
    { name: 'Finished',    value: monthEntries.filter(e => e.status === 'Finished').length,    fill: STATUS_COLORS['Finished'] },
    { name: 'In Progress', value: monthEntries.filter(e => e.status === 'In Progress').length,  fill: STATUS_COLORS['In Progress'] },
    { name: 'Not Started', value: monthEntries.filter(e => e.status === 'Not Started').length,  fill: STATUS_COLORS['Not Started'] },
  ].filter(d => d.value > 0);

  const employeeMonthData = employees.map(emp => ({
    name: emp.split(' ')[0],
    Finished:      monthEntries.filter(e => e.employee === emp && e.status === 'Finished').length,
    'In Progress': monthEntries.filter(e => e.employee === emp && e.status === 'In Progress').length,
    'Not Started': monthEntries.filter(e => e.employee === emp && e.status === 'Not Started').length,
  })).filter(e => e.Finished + e['In Progress'] + e['Not Started'] > 0);

  const byMonthEmployee = Array.from({ length: 12 }, (_, i) => {
    const mo = yearEntries.filter(e => e.periodMonth === i);
    const row = { month: monthShort[i] };
    employees.forEach(emp => { row[emp.split(' ')[0]] = mo.filter(e => e.employee === emp).length; });
    return row;
  });

  const employeeFirstNames = employees.map(e => e.split(' ')[0]);

  if (monthEntries.length === 0 && yearEntries.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="small fw-bold text-muted text-uppercase mb-3" style={{ letterSpacing: '0.05em' }}>
        Live Statistics
      </p>
      <Row className="gx-4">
        {statusData.length > 0 && (
          <Col xs={12} md={4} className="mb-4">
            <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Status breakdown
              </h6>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3} />
                  <Tooltip formatter={(v, name) => [`${v} docs`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex flex-column gap-1 mt-2">
                {statusData.map(entry => (
                  <div key={entry.name} className="d-flex align-items-center gap-2 small">
                    <span className="rounded-circle flex-shrink-0" style={{ width: 9, height: 9, backgroundColor: entry.fill, display: 'inline-block' }} />
                    <span className="text-muted">{entry.name}</span>
                    <span className="fw-bold ms-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        )}

        {employeeMonthData.length > 0 && (
          <Col xs={12} md={statusData.length > 0 ? 8 : 12} className="mb-4">
            <Card className="border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Per employee — this month
              </h6>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={employeeMonthData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="Finished"    stackId="a" fill={STATUS_COLORS['Finished']} />
                  <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS['In Progress']} />
                  <Bar dataKey="Not Started" stackId="a" fill={STATUS_COLORS['Not Started']} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {yearEntries.length > 0 && (
          <Col xs={12} className="mb-2">
            <Card className="border-0 shadow-sm rounded-4 p-4">
              <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Employee workload by month — {selectedYear}
              </h6>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byMonthEmployee} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  {employeeFirstNames.map((name, i) => (
                    <Bar key={name} dataKey={name} fill={EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]} radius={[3,3,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}

export default InlineCharts;
