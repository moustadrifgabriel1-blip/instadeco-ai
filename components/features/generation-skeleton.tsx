import { Card, CardContent } from '@/components/ui/card';

export function GenerationSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-gray-200 animate-pulse" />
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3 mt-3" />
        </div>
      </CardContent>
    </Card>
  );
}
