'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Trip, TripMember } from '@/types'

interface Props {
  trip: Trip
  initialMembers: TripMember[]
  isCreator: boolean
  userId: string
}

const ROLE_LABELS: Record<string, string> = {
  creator: '發起者',
  collaborator: '協助者',
  member: '成員',
}

export default function MembersClient({ trip, initialMembers, isCreator, userId }: Props) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEdit(member: TripMember) {
    if (editingId === member.id) {
      // Save
      if (!editValue.trim()) return
      setLoading(true)
      const supabase = createClient()
      await supabase.from('trip_members').update({ nickname: editValue.trim() }).eq('id', member.id)
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, nickname: editValue.trim() } : m))
      setEditingId(null)
      setLoading(false)
    } else {
      setEditingId(member.id)
      setEditValue(member.nickname)
    }
  }

  async function handleDelete(memberId: string) {
    if (!confirm('確定要移除這位成員嗎？')) return
    const supabase = createClient()
    await supabase.from('trip_members').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
    router.refresh()
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newNickname.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      nickname: newNickname.trim(),
      role: 'member',
      per_person_contribution: 0,
    }).select().single()
    if (data) setMembers(prev => [...prev, data])
    setNewNickname('')
    setAdding(false)
    setLoading(false)
    router.refresh()   // Sync member count shown on trip detail page
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-semibold text-indigo-600 flex-shrink-0">
                {member.nickname.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                {editingId === member.id ? (
                  <Input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                    className="py-1.5"
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700">{member.nickname}</p>
                    <Badge variant={member.role === 'creator' ? 'purple' : member.role === 'collaborator' ? 'info' : 'default'} className="mt-0.5">
                      {ROLE_LABELS[member.role]}
                    </Badge>
                  </>
                )}
              </div>

              {/* Actions - only for creator, and not for creator/collaborator members */}
              {isCreator && member.role === 'member' && trip.status === 'active' && (
                <div className="flex gap-1">
                  {editingId === member.id ? (
                    <>
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Add member */}
      {isCreator && trip.status === 'active' && (
        <Card>
          {adding ? (
            <form onSubmit={handleAddMember} className="flex gap-2">
              <Input
                placeholder="新成員暱稱"
                value={newNickname}
                onChange={e => setNewNickname(e.target.value)}
                autoFocus
              />
              <Button type="submit" loading={loading} size="sm">加入</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                <X className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <Button variant="outline" fullWidth onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4" />
              新增成員
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
