"use client"
import { useMemo, useState } from "react"
import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react"
import {
  Center,
  Group,
  keys,
  ScrollArea,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core"
import classes from "./TableSort.module.css"

type LiftKey = "squatKg" | "benchKg" | "deadliftKg" | "totalKg"
type SortKey = "name" | "bodyweightKg" | LiftKey

interface RowData {
  name: string
  bodyweightKg: number
  squatKg: number
  benchKg: number
  deadliftKg: number
  totalKg: number
}

interface ThProps {
  children: React.ReactNode
  reversed: boolean
  sorted: boolean
  onSort: () => void
  align?: "left" | "right" | "center"
}

function Th({ children, reversed, sorted, onSort, align = "left" }: ThProps) {
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector
  return (
    <Table.Th className={classes.th} style={{ textAlign: align }}>
      <UnstyledButton
        onClick={onSort}
        className={classes.control}
        style={{ width: "100%" }}
      >
        <Group justify="space-between" gap="xs">
          <Text fw={600} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={16} stroke={1.7} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  )
}

const initial: Omit<RowData, "totalKg">[] = [
  {
    name: "Alex Tan",
    bodyweightKg: 83,
    squatKg: 220,
    benchKg: 140,
    deadliftKg: 260,
  },
  {
    name: "Jordan Wang",
    bodyweightKg: 74,
    squatKg: 200,
    benchKg: 130,
    deadliftKg: 245,
  },
  {
    name: "Jamie Lee",
    bodyweightKg: 63,
    squatKg: 165,
    benchKg: 100,
    deadliftKg: 200,
  },
  {
    name: "Chris Patel",
    bodyweightKg: 93,
    squatKg: 210,
    benchKg: 145,
    deadliftKg: 250,
  },
  {
    name: "Riley Smith",
    bodyweightKg: 69,
    squatKg: 170,
    benchKg: 105,
    deadliftKg: 205,
  },
  {
    name: "Taylor Brown",
    bodyweightKg: 105,
    squatKg: 230,
    benchKg: 155,
    deadliftKg: 270,
  },
]

const data: RowData[] = initial.map((x) => ({
  ...x,
  totalKg: x.squatKg + x.benchKg + x.deadliftKg,
}))

function formatKg(n: number) {
  return `${n} kg`
}

function searchFilter(rows: RowData[], query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return rows
  return rows.filter((r) => r.name.toLowerCase().includes(q))
}

function sortRows(
  rows: RowData[],
  {
    sortBy,
    reversed,
    search,
  }: { sortBy: SortKey | null; reversed: boolean; search: string }
) {
  const filtered = searchFilter(rows, search)
  if (!sortBy) return filtered

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortBy as keyof RowData]
    const bv = b[sortBy as keyof RowData]
    if (typeof av === "number" && typeof bv === "number") {
      return av - bv
    }
    return String(av).localeCompare(String(bv))
  })
  return reversed ? sorted.reverse() : sorted
}

export function TableSort() {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey | null>("totalKg")
  const [reverseSortDirection, setReverseSortDirection] = useState(true) // start with Total desc

  const sortedData = useMemo(
    () => sortRows(data, { sortBy, reversed: reverseSortDirection, search }),
    [search, sortBy, reverseSortDirection]
  )

  const setSorting = (field: SortKey) => {
    const reversed =
      field === sortBy ? !reverseSortDirection : field === "name" ? false : true
    setReverseSortDirection(reversed)
    setSortBy(field)
  }

  const rows = sortedData.map((row, idx) => {
    const rank = idx + 1
    const medal =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank
    return (
      <Table.Tr key={row.name}>
        <Table.Td style={{ width: 60, textAlign: "center", fontWeight: 700 }}>
          {medal}
        </Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {formatKg(row.bodyweightKg)}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {formatKg(row.squatKg)}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {formatKg(row.benchKg)}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {formatKg(row.deadliftKg)}
        </Table.Td>
        <Table.Td style={{ textAlign: "right", fontWeight: 700 }}>
          {formatKg(row.totalKg)}
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <ScrollArea>
      <TextInput
        placeholder="Search athlete by name"
        mb="md"
        leftSection={<IconSearch size={16} stroke={1.7} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <Table
        horizontalSpacing="md"
        verticalSpacing="xs"
        miw={800}
        layout="fixed"
        highlightOnHover
        striped
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 60, textAlign: "center" }}>Rank</Table.Th>
            <Th
              sorted={sortBy === "name"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("name")}
            >
              Athlete
            </Th>
            <Th
              align="right"
              sorted={sortBy === "bodyweightKg"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("bodyweightKg")}
            >
              BW (kg)
            </Th>
            <Th
              align="right"
              sorted={sortBy === "squatKg"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("squatKg")}
            >
              Squat
            </Th>
            <Th
              align="right"
              sorted={sortBy === "benchKg"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("benchKg")}
            >
              Bench
            </Th>
            <Th
              align="right"
              sorted={sortBy === "deadliftKg"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("deadliftKg")}
            >
              Deadlift
            </Th>
            <Th
              align="right"
              sorted={sortBy === "totalKg"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("totalKg")}
            >
              Total
            </Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Text fw={500} ta="center">
                  No athletes found
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}

export default function LeaderboardPage() {
  return (
    <div>
      <Text fz="xl" fw={700} mb="md">
        Leaderboard
      </Text>
      <TableSort />
    </div>
  )
}
