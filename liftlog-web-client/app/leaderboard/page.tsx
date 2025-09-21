"use client"
import { useMemo, useState, useEffect } from "react"

import {
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react"

import {
  Badge,
  Center,
  Group,
  ScrollArea,
  SegmentedControl,
  Table,
  Text,
  TextInput,
  UnstyledButton,
  Loader,
  Anchor,
} from "@mantine/core"
import classes from "./TableSort.module.css"

// adjust this import path if your helper lives elsewhere
import { fetchLeaderboardRows, RowData } from "../firebase/functions"

type SexType = "M" | "F"
type LiftKey = "squatKg" | "benchKg" | "deadliftKg" | "totalKg"
type SortKey = "name" | "bodyweightKg" | LiftKey

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

function formatKg(n: number) {
  return `${n} kg`
}

function searchFilter(rows: RowData[], query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return rows
  return rows.filter((r) => r.name.toLowerCase().includes(q))
}

function sexFilter(rows: RowData[], sex: "ALL" | SexType) {
  if (sex === "ALL") return rows
  return rows.filter((r) => r.sex === sex)
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
    if (typeof av === "number" && typeof bv === "number") return av - bv
    return String(av).localeCompare(String(bv))
  })
  return reversed ? sorted.reverse() : sorted
}

function TableSort() {
  const [search, setSearch] = useState("")
  const [sex, setSex] = useState<"ALL" | SexType>("ALL")
  const [sortBy, setSortBy] = useState<SortKey | null>("totalKg")
  const [reverseSortDirection, setReverseSortDirection] = useState(true) // start with Total desc
  const [data, setData] = useState<RowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fetchLeaderboardRows({ sex: "ALL", topN: 50, includeZeros: false })
      .then((rows) => {
        if (alive) setData(rows)
        console.log(rows)
      })
      .catch((e) => {
        console.error(e)
        if (alive) setError("Failed to load leaderboard")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const sortedData = useMemo(() => {
    const bySex = sexFilter(data, sex)
    return sortRows(bySex, { sortBy, reversed: reverseSortDirection, search })
  }, [data, search, sortBy, reverseSortDirection, sex]) // ← include `data`

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
      <Table.Tr key={row.uid ?? row.name}>
        <Table.Td style={{ width: 60, textAlign: "center", fontWeight: 700 }}>
          {medal}
        </Table.Td>
        <Table.Td>{row.name}</Table.Td>
        <Table.Td>
          <Badge variant="light" color={row.sex === "M" ? "blue" : "pink"}>
            {row.sex}
          </Badge>
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {formatKg(row.weightClass)}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {row.video?.squat ? (
            <Anchor
              href={`/watch?v=${"processed-" + row.video.squat}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              {formatKg(row.squatKg)}
            </Anchor>
          ) : (
            formatKg(row.squatKg)
          )}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {row.video?.bench ? (
            <Anchor
              href={`/watch?v=${"processed-" + row.video.bench}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              {formatKg(row.benchKg)}
            </Anchor>
          ) : (
            formatKg(row.benchKg)
          )}
        </Table.Td>
        <Table.Td style={{ textAlign: "right" }}>
          {row.video?.deadlift ? (
            <Anchor
              href={`/watch?v=${"processed-" + row.video.deadlift}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              {formatKg(row.deadliftKg)}
            </Anchor>
          ) : (
            formatKg(row.deadliftKg)
          )}
        </Table.Td>

        <Table.Td style={{ textAlign: "right", fontWeight: 700 }}>
          {formatKg(row.totalKg)}
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <ScrollArea>
      <Group justify="space-between" mb="md">
        <TextInput
          placeholder="Search athlete by name"
          leftSection={<IconSearch size={16} stroke={1.7} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w="100%"
          style={{ maxWidth: 420 }}
        />
        <SegmentedControl
          value={sex}
          onChange={(v) => setSex(v as "ALL" | SexType)}
          data={[
            { label: "All", value: "ALL" },
            { label: "Men", value: "M" },
            { label: "Women", value: "F" },
          ]}
        />
      </Group>

      {loading ? (
        <Group justify="center" py="lg">
          <Loader />
        </Group>
      ) : error ? (
        <Text c="red" ta="center" py="lg">
          {error}
        </Text>
      ) : (
        <Table
          horizontalSpacing="md"
          verticalSpacing="xs"
          miw={880}
          layout="fixed"
          highlightOnHover
          striped
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 60, textAlign: "center" }}>
                Rank
              </Table.Th>
              <Th
                sorted={sortBy === "name"}
                reversed={reverseSortDirection}
                onSort={() => setSorting("name")}
              >
                Athlete
              </Th>
              <Table.Th style={{ width: 80, textAlign: "left" }}>Sex</Table.Th>
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
                <Table.Td colSpan={8}>
                  <Text fw={500} ta="center">
                    No athletes found
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      )}
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
