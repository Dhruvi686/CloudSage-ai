import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { SpendTrendChart } from '../components/dashboard/SpendTrendChart';
import { SavingsChart } from '../components/dashboard/SavingsChart';
import { FinOpsScoreCard } from '../components/dashboard/FinOpsScoreCard';
import { RecommendationsPreview } from '../components/dashboard/RecommendationsPreview';
import { LoadingState } from '../components/shared/LoadingState';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { useDashboard, useRecommendations, useForecast, useScore } from '../hooks/useAnalytics';

export default function DashboardPage() {
  const dashboard = useDashboard();
  const recommendations = useRecommendations();
  const forecast = useForecast();
  const score = useScore();

  if (dashboard.isLoading) return <LoadingState />;
  if (dashboard.error?.message?.includes('No analytics data'))
    return <EmptyState title="No Data Yet" message="Upload your infrastructure datasets to see the executive dashboard." />;
  if (dashboard.isError) return <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />;
  if (!dashboard.data) return null;

  return (
    <>
      <PageHeader title="Executive Dashboard" description="Cloud infrastructure cost intelligence overview" />
      <div className="space-y-6">
        <SummaryCards data={dashboard.data} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {forecast.data && <SpendTrendChart data={forecast.data} />}
          {recommendations.data && <SavingsChart recommendations={recommendations.data} />}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {score.data && <FinOpsScoreCard data={score.data} />}
          {recommendations.data && <RecommendationsPreview recommendations={recommendations.data} />}
        </div>
      </div>
    </>
  );
}
