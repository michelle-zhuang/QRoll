import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "src/components/ui/chart";

const chartConfig: ChartConfig = {
  present: { label: "Present", color: "hsl(151 60% 75%)" },
  late: { label: "Late", color: "hsl(38 92% 75%)" },
  absent: { label: "Absent", color: "hsl(0 78% 78%)" },
};

interface PerEventDatum {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export function PerEventStackedBars({ data }: { data: PerEventDatum[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[320px] w-full aspect-auto">
      <BarChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="late" stackId="a" fill="var(--color-late)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

interface AttendeeBar {
  name: string;
  present: number;
  late: number;
  absent: number;
}

function truncateName(name: string, max = 18) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function TopAttendeesChart({ data }: { data: AttendeeBar[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[420px] w-full aspect-auto">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          tick={{ fontSize: 11 }}
          interval={0}
          tickFormatter={(v: string) => truncateName(v)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="present" stackId="a" fill="var(--color-present)" />
        <Bar dataKey="late" stackId="a" fill="var(--color-late)" />
        <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
