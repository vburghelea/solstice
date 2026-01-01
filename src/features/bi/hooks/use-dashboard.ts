import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWidget,
  createDashboard,
  deleteDashboard,
  removeWidget,
  updateDashboard,
  updateWidget,
} from "../bi.mutations";
import { getDashboard, getDashboards } from "../bi.queries";

export const useDashboards = () => {
  return useQuery({
    queryKey: ["bi-dashboards"],
    queryFn: () => getDashboards(),
  });
};

export const useDashboard = (dashboardId: string) => {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ["bi-dashboard", dashboardId],
    queryFn: () => getDashboard({ data: { dashboardId } }),
    enabled: Boolean(dashboardId),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["bi-dashboard", dashboardId] });
    await queryClient.invalidateQueries({ queryKey: ["bi-dashboards"] });
  };

  const updateDashboardMutation = useMutation({
    mutationFn: updateDashboard,
    onSuccess: invalidate,
  });

  const addWidgetMutation = useMutation({
    mutationFn: addWidget,
    onSuccess: invalidate,
  });

  const updateWidgetMutation = useMutation({
    mutationFn: updateWidget,
    onSuccess: invalidate,
  });

  const removeWidgetMutation = useMutation({
    mutationFn: removeWidget,
    onSuccess: invalidate,
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: deleteDashboard,
    onSuccess: invalidate,
  });

  return {
    dashboard: dashboardQuery.data,
    widgets: dashboardQuery.data?.widgets ?? [],
    isLoading: dashboardQuery.isLoading,
    refresh: dashboardQuery.refetch,
    updateDashboard: updateDashboardMutation,
    addWidget: addWidgetMutation,
    updateWidget: updateWidgetMutation,
    removeWidget: removeWidgetMutation,
    deleteDashboard: deleteDashboardMutation,
  };
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDashboard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bi-dashboards"] }),
  });
};
