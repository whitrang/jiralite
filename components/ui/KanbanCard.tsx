import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "./card"
import { Paperclip, MessageCircle } from "lucide-react"

export interface Badge {
  label: string
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger"
}

export interface Assignee {
  name: string
  avatar?: string
  initials?: string
}

export interface KanbanCardProps {
  title: string
  description?: string
  badges?: Badge[]
  image?: string
  assignees?: Assignee[]
  attachments?: number
  comments?: number
  className?: string
}

const badgeVariants = {
  default: "bg-purple-100 text-purple-700",
  primary: "bg-blue-100 text-blue-700",
  secondary: "bg-pink-100 text-pink-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-orange-100 text-orange-700",
  danger: "bg-red-100 text-red-700",
}

function KanbanCard({
  title,
  description,
  badges = [],
  image,
  assignees = [],
  attachments,
  comments,
  className,
}: KanbanCardProps) {
  return (
    <Card className={cn("w-full max-w-[320px] p-0 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow", className)}>
      {image && (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4 space-y-3">
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  badgeVariants[badge.variant || "default"]
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        )}

        <hr className="my-2 border-gray-200" />

        <div className="flex items-center justify-between pt-2">
          {assignees.length > 0 && (
            <div className="flex -space-x-2">
              {assignees.map((assignee, index) => (
                assignee.avatar ? (
                  <img
                    key={index}
                    src={assignee.avatar}
                    alt={assignee.name}
                    title={assignee.name}
                    className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover"
                  />
                ) : (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                    title={assignee.name}
                  >
                    <span>{assignee.initials || assignee.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                )
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-gray-400 text-sm ml-auto">
            {attachments !== undefined && attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-4 h-4" />
                <span>{attachments}</span>
              </div>
            )}
            {comments !== undefined && comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export { KanbanCard }

