import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  order_id: string | null;
}

interface Props {
  userId: string;
  walletBalance: number;
  earningBalance?: number;
  deliveryType: "fixed" | "part_time";
}

const DeliveryWallet = ({ userId, walletBalance, earningBalance = 0, deliveryType }: Props) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("delivery_staff_wallet_transactions")
      .select("*")
      .eq("staff_user_id", userId)
      .order("created_at", { ascending: false });
    setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [userId]);

  const filtered = transactions.filter((t) => {
    if (dateFrom && new Date(t.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(t.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  // Collections = credits from delivery orders (amount collected from customer)
  const totalCollections = filtered.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  // Settlements = delivery amount transferred to office (collection settlements)
  const totalCollectionSettlements = filtered.filter(t => t.type === "settlement").reduce((s, t) => s + t.amount, 0);
  // Earning settlements = office paying back earnings to part-time staff
  const totalEarningSettlements = filtered.filter(t => t.type === "earning_settlement").reduce((s, t) => s + t.amount, 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "credit": return { label: "Collection", variant: "default" as const };
      case "settlement": return { label: "Settled to Office", variant: "destructive" as const };
      case "earning_credit": return { label: "Earning", variant: "secondary" as const };
      case "earning_settlement": return { label: "Earning Received", variant: "outline" as const };
      default: return { label: type, variant: "outline" as const };
    }
  };

  const getAmountColor = (type: string) => {
    if (type === "credit") return "text-amber-600 font-medium";
    if (type === "earning_credit" || type === "earning_settlement") return "text-green-600 font-medium";
    return "text-destructive font-medium";
  };

  const getAmountPrefix = (type: string) => {
    if (type === "credit" || type === "earning_credit" || type === "earning_settlement") return "+";
    return "-";
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className={`grid gap-4 ${deliveryType === "part_time" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        {/* Total Collections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collections</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">₹{totalCollections}</p>
            <p className="text-xs text-muted-foreground mt-1">Credited from deliveries</p>
          </CardContent>
        </Card>

        {/* Collection Settled */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Settled</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">₹{totalCollectionSettlements}</p>
            <p className="text-xs text-muted-foreground mt-1">Transferred to office</p>
          </CardContent>
        </Card>

        {/* Wallet Balance (after collection settlement) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{walletBalance}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending to settle</p>
          </CardContent>
        </Card>

        {/* Part-time only: Earning Balance */}
        {deliveryType === "part_time" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Earning Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">₹{earningBalance}</p>
              <p className="text-xs text-muted-foreground mt-1">To receive from office</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Part-time earning settlements summary */}
      {deliveryType === "part_time" && totalEarningSettlements > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">₹{totalEarningSettlements}</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <div className="flex flex-wrap gap-3 items-center mt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
            </div>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transactions</TableCell></TableRow>
                  ) : filtered.map((t) => {
                    const badge = getTypeBadge(t.type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                        </TableCell>
                        <TableCell className={getAmountColor(t.type)}>
                          {getAmountPrefix(t.type)}₹{t.amount}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.description ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryWallet;
