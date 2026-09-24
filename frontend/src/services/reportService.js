import { analyticsService } from './analyticsService';
import { predictionService } from './predictionService';
import { sessionService } from './sessionService';

export const reportService = {
  async generateWorkflowReport(workflowId = 'job_application', options = {}) {
    const [summary, graph, bottlenecks, paths, modelMetrics, sessionsData] = await Promise.all([
      analyticsService.getSummary(workflowId),
      analyticsService.getGraph(workflowId),
      analyticsService.getBottlenecks(workflowId),
      analyticsService.getPaths(workflowId),
      predictionService.getModelMetrics(workflowId).catch(() => null),
      sessionService.getSessions({ workflow_id: workflowId, limit: 100 }).catch(() => ({ sessions: [] }))
    ]);

    const generatedAt = new Date().toISOString();
    const topBottleneck = bottlenecks && bottlenecks.length > 0 ? bottlenecks[0] : null;

    // Narrative synthesis derived purely from real analytics:
    const narrativeExecutive = topBottleneck
      ? `${topBottleneck.label} has the highest observed drop-off rate at ${topBottleneck.drop_off_pct}% with ${topBottleneck.users_abandoning} abandonments out of ${topBottleneck.users_entering} entrants. The workflow demonstrates an overall completion rate of ${summary.completion_rate}% across ${summary.total_sessions} logged journeys, with an average completion duration of ${summary.avg_completion_time}s.`
      : `The workflow demonstrates an overall completion rate of ${summary.completion_rate}% across ${summary.total_sessions} logged journeys with no major bottlenecks currently detected.`;

    const narrativeEfficiency = paths.shortest_successful_path?.length
      ? `The theoretical shortest successful path spans ${paths.shortest_successful_path.length} steps (${paths.shortest_successful_path.join(' → ')}), while observed sessions average ${summary.avg_journey_length} steps. This reflects a ${(summary.avg_journey_length / Math.max(paths.shortest_successful_path.length, 1)).toFixed(2)}x journey path ratio due to repeated loops and retries.`
      : `Journey length averages ${summary.avg_journey_length} steps across all user journeys.`;

    return {
      workflowId,
      generatedAt,
      options,
      summary,
      graph,
      bottlenecks,
      paths,
      modelMetrics,
      sessions: sessionsData.sessions || [],
      narratives: {
        executive: narrativeExecutive,
        efficiency: narrativeEfficiency,
      }
    };
  },

  exportToCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
              cell = cell.replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
