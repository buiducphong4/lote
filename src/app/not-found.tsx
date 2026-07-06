import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="glass rounded-lg p-8 text-center">
      <h1 className="text-3xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">Game hoặc đường dẫn không hợp lệ.</p>
      <Button className="mt-5" asChild>
        <Link href="/">Về tổng quan</Link>
      </Button>
    </section>
  );
}
