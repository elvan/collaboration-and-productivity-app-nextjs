"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AbTestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create A/B Test</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>
            Set up a new A/B test for your notification settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Test Name
            </Label>
            <Input
              id="name"
              placeholder="Enter test name"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="variant-a" className="text-right">
              Variant A
            </Label>
            <Input
              id="variant-a"
              placeholder="Variant A description"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="variant-b" className="text-right">
              Variant B
            </Label>
            <Input
              id="variant-b"
              placeholder="Variant B description"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Create Test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
