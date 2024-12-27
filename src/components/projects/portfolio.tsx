import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart2, Clock, Users } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Project {
  id: string
  name: string
  description: string
  progress: number
  status: "on-track" | "at-risk" | "delayed"
  team: number
  deadline: string
}

const projects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Modernizing the company website with new features",
    progress: 75,
    status: "on-track",
    team: 5,
    deadline: "2024-03-15",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Building a new mobile app for customers",
    progress: 45,
    status: "at-risk",
    team: 8,
    deadline: "2024-04-30",
  },
  {
    id: "3",
    name: "Data Migration",
    description: "Migrating data to the new cloud infrastructure",
    progress: 20,
    status: "delayed",
    team: 4,
    deadline: "2024-05-15",
  },
]

export function Portfolio() {
  return (
    <div className="h-full">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Portfolio Overview</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="on-track">On Track</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="progress">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="team-size">Team Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  project.status === "on-track"
                    ? "bg-green-100 text-green-800"
                    : project.status === "at-risk"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {project.status.replace("-", " ")}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="h-2 bg-secondary rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{project.team} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Due {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
