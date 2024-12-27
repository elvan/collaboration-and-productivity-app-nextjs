import { useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentList } from "./comment-list"
import { ActivityFeed } from "./activity-feed"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useTaskDetails } from "@/hooks/use-task-details"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskTypeSelector } from "./task-type-selector"
import { TaskStatusSelector } from "./task-status-selector"
import { CustomFieldEditor } from "./custom-field-editor"
import { TimeTrackingButton } from "./time-tracking-button"
import { TaskTemplateSelector } from "./task-template-selector"

interface TaskDetailsProps {
  taskId: string
}

export function TaskDetails({ taskId }: TaskDetailsProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("details")
  const [activityFilter, setActivityFilter] = useState("all")
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false)

  const {
    task,
    comments,
    activities,
    activityStats,
    taskTypes,
    taskStatuses,
    customFields,
    templates,
    automationRules,
    isLoading,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
    updateTaskType,
    updateTaskStatus,
    updateCustomFields,
    createTemplate,
    createAutomationRule,
  } = useTaskDetails(taskId)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Card>
    )
  }

  if (!task) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <Icons.alertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Task not found</p>
        </div>
      </Card>
    )
  }

  const selectedType = taskTypes?.find((type) => type.id === task.typeId)
  const customFieldValues = task.customFields ? JSON.parse(task.customFields as string) : {}

  return (
    <Card className="p-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="details" className="space-x-2">
              <Icons.layout className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="space-x-2">
              <Icons.messageSquare className="h-4 w-4" />
              <span>Comments</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="space-x-2">
              <Icons.activity className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="space-x-2">
              <Icons.zap className="h-4 w-4" />
              <span>Automations</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <TimeTrackingButton
              taskId={taskId}
              onTimeUpdate={() => {
                // Refresh task data
              }}
            />
            <TaskTemplateSelector
              projectId={task.projectId}
              onSelect={(template) => {
                // Apply template to task
              }}
              onCreate={createTemplate}
            />
          </div>
        </div>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <TaskTypeSelector
                  taskTypes={taskTypes || []}
                  value={task.typeId}
                  onChange={updateTaskType}
                />
              </div>
              <div className="flex-1">
                <TaskStatusSelector
                  statuses={taskStatuses || []}
                  value={task.statusId}
                  onChange={updateTaskStatus}
                />
              </div>
            </div>

            {selectedType?.fields && (
              <div className="space-y-6">
                {selectedType.fields.map((field) => (
                  <CustomFieldEditor
                    key={field.id}
                    field={field}
                    value={customFieldValues[field.id]}
                    onChange={(value) =>
                      updateCustomFields({
                        [field.id]: value,
                      })
                    }
                    users={[]}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <CommentList
            comments={comments || []}
            taskId={taskId}
            onAddComment={createComment}
            onEditComment={updateComment}
            onDeleteComment={deleteComment}
            onAddReaction={addReaction}
            onRemoveReaction={removeReaction}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed
            activities={activities || []}
            stats={activityStats}
            filter={activityFilter}
            onFilterChange={setActivityFilter}
          />
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                Automation Rules
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage automation rules for this task.
              </p>
            </div>
            <Button
              onClick={() => setIsAutomationDialogOpen(true)}
            >
              <Icons.plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {automationRules?.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{rule.name}</CardTitle>
                      <CardDescription>
                        {rule.description}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => {
                        // Toggle rule enabled state
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <h4 className="font-medium">Trigger</h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.trigger
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1)
                          )
                          .join(" ")}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Conditions</h4>
                      <ul className="mt-2 space-y-2">
                        {rule.conditions.map(
                          (condition, index) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground"
                            >
                              {condition.field}{" "}
                              {condition.operator
                                .split("_")
                                .join(" ")}{" "}
                              {condition.value}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium">Actions</h4>
                      <ul className="mt-2 space-y-2">
                        {rule.actions.map((action, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {action.type
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1)
                              )
                              .join(" ")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isAutomationDialogOpen}
        onOpenChange={setIsAutomationDialogOpen}
      >
        <DialogContent className="max-w-4xl">
          <AutomationRuleEditor
            onSave={(rule) => {
              createAutomationRule(rule)
              setIsAutomationDialogOpen(false)
            }}
            onCancel={() => setIsAutomationDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
