import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Database, 
  Clock, 
  Users, 
  Target, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import { 
  LearningMetrics, 
  RetrainingTrigger, 
  ModelVersion, 
  LearningProgress,
  DatasetStats 
} from '@/types/autoLearning';
import { autoLearningService } from '@/services/autoLearningService';
import { datasetManager } from '@/services/datasetManager';
import { similarityService } from '@/services/similarityService';
import { toast } from 'sonner';

export const LearningDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [triggers, setTriggers] = useState<RetrainingTrigger[]>([]);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const [
        metricsData,
        triggersData,
        versionsData,
        progressData,
        statsData
      ] = await Promise.all([
        autoLearningService.getLearningMetrics(),
        autoLearningService.getRetrainingTriggers(),
        autoLearningService.getModelVersions(),
        autoLearningService.getLearningProgress(),
        datasetManager.getDatasetStats()
      ]);

      setMetrics(metricsData);
      setTriggers(triggersData);
      setModelVersions(versionsData);
      setLearningProgress(progressData);
      setDatasetStats(statsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh dashboard
  const refreshDashboard = async () => {
    setRefreshing(true);
    await loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  // Trigger manual retraining
  const triggerRetraining = async () => {
    try {
      await autoLearningService.triggerManualRetraining();
      toast.success('Manual retraining initiated');
      await loadDashboardData();
    } catch (error) {
      toast.error('Failed to trigger retraining');
    }
  };

  // Export dataset
  const exportDataset = async () => {
    try {
      const data = await datasetManager.exportDataset('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dataset exported successfully');
    } catch (error) {
      toast.error('Failed to export dataset');
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auto-Learning Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage the AI learning system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshDashboard} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={triggerRetraining}>
            <Brain className="h-4 w-4 mr-2" />
            Trigger Retraining
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Model Accuracy</p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics ? (metrics.modelAccuracy * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={metrics ? metrics.modelAccuracy * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified Samples</p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics?.verifiedSamples || 0}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {metrics?.pendingSamples || 0} pending verification
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Learning Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {learningProgress?.progress.toFixed(0) || 0}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Progress value={learningProgress?.progress || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contributors</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics?.userContributions.length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Active contributors this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">Learning Progress</TabsTrigger>
          <TabsTrigger value="dataset">Dataset</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Accuracy by object category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.categoryPerformance.map((category) => (
                    <div key={category.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category.category}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {(category.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={category.accuracy * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{category.sampleCount} samples</span>
                        <span className={category.improvementTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                          {category.improvementTrend > 0 ? '+' : ''}{(category.improvementTrend * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>
                  Users providing the most feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.userContributions.slice(0, 5).map((user) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <div className="font-medium">User #{user.userId.slice(-4)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.correctionsProvided} corrections, {user.matchesConfirmed} confirmations
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">#{user.contributionRank}</Badge>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {(user.qualityScore * 100).toFixed(0)}% quality
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Progress Tab */}
        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Current Learning Phase
              </CardTitle>
              <CardDescription>
                {learningProgress?.currentTask}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">
                  {learningProgress?.currentPhase.replace('_', ' ')}
                </span>
                <Badge variant={
                  learningProgress?.currentPhase === 'training' ? 'default' :
                  learningProgress?.currentPhase === 'deployment' ? 'default' : 'secondary'
                }>
                  {learningProgress?.progress.toFixed(0)}%
                </Badge>
              </div>
              
              <Progress value={learningProgress?.progress || 0} className="h-3" />
              
              {learningProgress?.estimatedCompletion && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Estimated completion: {new Date(learningProgress.estimatedCompletion).toLocaleString()}
                </div>
              )}

              {learningProgress?.logs && learningProgress.logs.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Activity:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {learningProgress.logs.slice(-5).map((log, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dataset Tab */}
        <TabsContent value="dataset" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Statistics</CardTitle>
                <CardDescription>
                  Current dataset overview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {datasetStats?.totalImages || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Images
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {datasetStats?.verifiedImages || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Verified
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {datasetStats?.categoriesCount || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Categories
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {datasetStats?.avgQualityScore.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Quality
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Recent additions (7 days):</span>
                    <span className="font-medium">{datasetStats?.recentAdditions || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duplicates removed:</span>
                    <span className="font-medium">{datasetStats?.duplicatesRemoved || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage used:</span>
                    <span className="font-medium">{datasetStats?.storageUsed || '0 MB'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dataset Actions</CardTitle>
                <CardDescription>
                  Manage and export dataset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportDataset} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Dataset (JSON)
                </Button>
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Quality Report
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Dataset Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Versions</CardTitle>
              <CardDescription>
                History of model training and deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelVersions.map((version) => (
                  <div key={version.version} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.version}</span>
                        <Badge variant={
                          version.status === 'active' ? 'default' :
                          version.status === 'testing' ? 'secondary' : 'outline'
                        }>
                          {version.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {version.trainingDate}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy:</span>
                        <span className="ml-2 font-medium">{(version.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Samples:</span>
                        <span className="ml-2 font-medium">{version.sampleCount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Improvements:</span>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {version.improvements.map((improvement, index) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Retraining Triggers</CardTitle>
              <CardDescription>
                Automated and manual retraining triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div key={trigger.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {trigger.triggerType.replace('_', ' ')}
                        </span>
                        <Badge variant={
                          trigger.status === 'triggered' ? 'destructive' :
                          trigger.status === 'completed' ? 'default' :
                          trigger.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {trigger.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(trigger.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress:</span>
                        <span>{trigger.currentValue}/{trigger.threshold}</span>
                      </div>
                      <Progress 
                        value={(trigger.currentValue / trigger.threshold) * 100} 
                        className="h-2 mt-1" 
                      />
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trigger.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningDashboard;