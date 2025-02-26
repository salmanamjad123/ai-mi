"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function LanguageDistribution() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Language</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">English</p>
              <span className="text-sm text-muted-foreground">100.0%</span>
            </div>
            <Progress value={100} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
