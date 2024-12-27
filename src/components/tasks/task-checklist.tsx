import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reorder } from 'framer-motion'
import { Grip, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  content: string
  checked: boolean
}

interface Checklist {
  id: string
  name: string
  items: ChecklistItem[]
}

interface TaskChecklistProps {
  taskId: string
  initialChecklists?: Checklist[]
  onUpdate: (checklists: Checklist[]) => void
  disabled?: boolean
}

export function TaskChecklist({
  taskId,
  initialChecklists = [],
  onUpdate,
  disabled = false,
}: TaskChecklistProps) {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists)
  const [newChecklistName, setNewChecklistName] = useState('')
  const [editingItem, setEditingItem] = useState<{
    checklistId: string
    itemId?: string
    content: string
  } | null>(null)

  useEffect(() => {
    setChecklists(initialChecklists)
  }, [initialChecklists])

  const handleAddChecklist = () => {
    if (!newChecklistName.trim()) return

    const newChecklist: Checklist = {
      id: crypto.randomUUID(),
      name: newChecklistName,
      items: [],
    }

    setChecklists((prev) => [...prev, newChecklist])
    setNewChecklistName('')
    onUpdate([...checklists, newChecklist])
  }

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists((prev) => prev.filter((cl) => cl.id !== checklistId))
    onUpdate(checklists.filter((cl) => cl.id !== checklistId))
  }

  const handleAddItem = (checklistId: string) => {
    setEditingItem({
      checklistId,
      content: '',
    })
  }

  const handleSaveItem = () => {
    if (!editingItem || !editingItem.content.trim()) return

    setChecklists((prev) =>
      prev.map((cl) => {
        if (cl.id !== editingItem.checklistId) return cl

        const items = editingItem.itemId
          ? cl.items.map((item) =>
              item.id === editingItem.itemId
                ? { ...item, content: editingItem.content }
                : item
            )
          : [
              ...cl.items,
              {
                id: crypto.randomUUID(),
                content: editingItem.content,
                checked: false,
              },
            ]

        return { ...cl, items }
      })
    )

    setEditingItem(null)
    onUpdate(checklists)
  }

  const handleDeleteItem = (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.filter((item) => item.id !== itemId) }
          : cl
      )
    )
    onUpdate(checklists)
  }

  const handleToggleItem = (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId
                  ? { ...item, checked: !item.checked }
                  : item
              ),
            }
          : cl
      )
    )
    onUpdate(checklists)
  }

  const handleReorderItems = (checklistId: string, newOrder: ChecklistItem[]) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId ? { ...cl, items: newOrder } : cl
      )
    )
    onUpdate(checklists)
  }

  return (
    <div className="space-y-6">
      {/* Add new checklist */}
      {!disabled && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="New checklist name"
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
          />
          <Button onClick={handleAddChecklist}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Checklists */}
      {checklists.map((checklist) => (
        <div key={checklist.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{checklist.name}</h4>
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteChecklist(checklist.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Reorder.Group
            axis="y"
            values={checklist.items}
            onReorder={(newOrder) => handleReorderItems(checklist.id, newOrder)}
            className="space-y-2"
          >
            {checklist.items.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className={cn(
                  'flex items-center space-x-2 rounded-md border p-2',
                  item.checked && 'bg-muted'
                )}
              >
                <Grip className="h-4 w-4 text-muted-foreground" />
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() =>
                    handleToggleItem(checklist.id, item.id)
                  }
                  disabled={disabled}
                />
                {editingItem?.itemId === item.id ? (
                  <Input
                    value={editingItem.content}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev!,
                        content: e.target.value,
                      }))
                    }
                    onBlur={handleSaveItem}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}
                    autoFocus
                  />
                ) : (
                  <span
                    className={cn(
                      'flex-1',
                      item.checked && 'text-muted-foreground line-through'
                    )}
                    onClick={() =>
                      !disabled &&
                      setEditingItem({
                        checklistId: checklist.id,
                        itemId: item.id,
                        content: item.content,
                      })
                    }
                  >
                    {item.content}
                  </span>
                )}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(checklist.id, item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Add new item */}
          {!disabled &&
            (!editingItem || editingItem.checklistId !== checklist.id) && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleAddItem(checklist.id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add item
              </Button>
            )}

          {editingItem?.checklistId === checklist.id && !editingItem.itemId && (
            <div className="flex items-center space-x-2">
              <Input
                value={editingItem.content}
                onChange={(e) =>
                  setEditingItem((prev) => ({
                    ...prev!,
                    content: e.target.value,
                  }))
                }
                onBlur={handleSaveItem}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}
                autoFocus
                placeholder="New item"
              />
              <Button onClick={handleSaveItem}>Add</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
