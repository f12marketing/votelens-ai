import { Upload, FileText, CheckCircle } from 'lucide-react';

export function Upload() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Election Data</h1>
        <p className="text-muted-foreground">Upload your election datasets for AI analysis</p>
      </div>

      {/* Upload Zone */}
      <div className="rounded-lg border-2 border-dashed bg-card p-12 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Drop your files here</h3>
        <p className="text-muted-foreground mb-4">or click to browse</p>
        <p className="text-sm text-muted-foreground">Supported formats: CSV, Excel, JSON (max 100MB)</p>
      </div>

      {/* Upload Instructions */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Guidelines</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Include election metadata</p>
              <p className="text-sm text-muted-foreground">Election name, date, type, and region</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Use consistent column names</p>
              <p className="text-sm text-muted-foreground">Standard format for constituency, candidate, and vote data</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Include demographic data</p>
              <p className="text-sm text-muted-foreground">Age, gender, and other demographics for better insights</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Recent Uploads */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Uploads</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">general_election_2024.csv</p>
                <p className="text-sm text-muted-foreground">24.5 MB • 2 hours ago</p>
              </div>
            </div>
            <span className="text-sm text-green-600">Completed</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">state_election_data.xlsx</p>
                <p className="text-sm text-muted-foreground">18.2 MB • 1 day ago</p>
              </div>
            </div>
            <span className="text-sm text-green-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
