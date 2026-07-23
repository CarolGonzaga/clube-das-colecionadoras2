import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { BadgePercent, Boxes, LayoutDashboard, LogOut, ReceiptText, Users } from "lucide-react";
import "@/admin.css";
import { archiveAdminProduct, deleteAdminCoupon, getAdminDashboard, saveAdminCoupon, saveAdminProduct } from "@/lib/admin";
import { dbService } from "@/lib/db";

export const Route = createFileRoute("/clubedascolecionadoras/admin")({
  ssr: false,
  beforeLoad: async () => { if (!(await dbService.getCurrentUser())) throw redirect({ to: "/clubedascolecionadoras/login" }); },
  loader: () => getAdminDashboard({ data: { page: 1, search: "", sort: "nick" } }),
  component: AdminPage,
});

const money = (cents: number) => (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "—";

function AdminPage() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<"overview" | "users" | "sales" | "coupons" | "products">("overview");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [coupon, setCoupon] = useState<any>({ code: "", discountPercent: 10, expiresAt: "", maxUses: "", maxUsesPerUser: 1, active: true });
  const [product, setProduct] = useState<any>({ id: "", name: "", description: "", productType: "pack", stickerNumber: "", packCount: 1, stickersPerPack: 5, price: "", pointPrice: "", imageUrl: "", displaySection: "pacotes", sortOrder: 100, active: true });

  const reload = async (nextSearch = search, sort: any = "nick") => {
    const result = await getAdminDashboard({ data: { page: 1, search: nextSearch, sort } });
    setData(result);
  };
  const run = async (action: () => Promise<any>) => { setMessage(""); try { await action(); setMessage("Alteração salva com sucesso."); await reload(); } catch (error: any) { setMessage(error?.message || "Não foi possível concluir a operação."); } };

  const approvedOrders = data.orders.filter((order: any) => order.payment_status === "approved");
  const approvedRevenue = approvedOrders.reduce((sum: number, order: any) => sum + Number(order.amount_due_cents || 0), 0);
  const activeCoupons = data.coupons.filter((item: any) => item.is_active).length;
  const activeProducts = data.products.filter((item: any) => item.active).length;
  const navigation = [
    ["overview", "Visão geral", LayoutDashboard],
    ["users", "Usuárias", Users],
    ["sales", "Vendas", ReceiptText],
    ["coupons", "Cupons", BadgePercent],
    ["products", "Loja", Boxes],
  ] as const;

  return <main className="admin-page">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>CC</span><div><b>Clube</b><small>Administração</small></div></div>
      <nav>{navigation.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon size={16}/><span>{label}</span></button>)}</nav>
      <button className="admin-exit" onClick={() => router.navigate({ to: "/clubedascolecionadoras" })}><LogOut size={15}/>Voltar ao site</button>
    </aside>
    <div className="admin-content">
      <header className="admin-header"><div><small>Painel administrativo</small><h1>{navigation.find(([id]) => id === tab)?.[1]}</h1></div><div className="admin-status"><i/> Sistema online</div></header>
      {message && <p className="admin-message">{message}</p>}

    {tab === "overview" && <section className="admin-overview">
      <div className="admin-metrics">
        <article><span>Usuárias cadastradas</span><b>{data.totalUsers.toLocaleString("pt-BR")}</b><small>Contas no sistema</small></article>
        <article><span>Receita aprovada</span><b>{money(approvedRevenue)}</b><small>Últimos {data.orders.length} pedidos</small></article>
        <article><span>Pedidos aprovados</span><b>{approvedOrders.length}</b><small>Na listagem recente</small></article>
        <article><span>Catálogo ativo</span><b>{activeProducts}</b><small>{activeCoupons} cupons ativos</small></article>
      </div>
      <div className="admin-overview-grid">
        <section className="admin-panel"><div className="admin-panel-title"><div><h2>Vendas recentes</h2><p>Últimas movimentações da loja</p></div><button onClick={() => setTab("sales")}>Ver todas</button></div><div className="admin-list">{data.orders.slice(0, 6).map((order: any) => <article key={order.id}><div><b>{order.order_code}</b><small>{date(order.created_at)}</small></div><span className={`admin-pill ${order.payment_status}`}>{order.payment_status}</span><strong>{money(order.amount_due_cents)}</strong></article>)}</div></section>
        <section className="admin-panel admin-shortcuts"><div className="admin-panel-title"><div><h2>Acesso rápido</h2><p>Operações mais utilizadas</p></div></div><button onClick={() => { setCoupon({ code: "", discountPercent: 10, expiresAt: "", maxUses: "", maxUsesPerUser: 1, active: true }); setTab("coupons"); }}><BadgePercent size={17}/><span><b>Criar cupom</b><small>Nova campanha de desconto</small></span></button><button onClick={() => { setProduct({ id: "", name: "", description: "", productType: "pack", stickerNumber: "", packCount: 1, stickersPerPack: 5, price: "", pointPrice: "", imageUrl: "", displaySection: "pacotes", sortOrder: 100, active: true }); setTab("products"); }}><Boxes size={17}/><span><b>Adicionar produto</b><small>Publicar novo item na loja</small></span></button><button onClick={() => setTab("users")}><Users size={17}/><span><b>Consultar usuária</b><small>Buscar conta e progresso</small></span></button></section>
      </div>
    </section>}

    {tab === "users" && <section className="admin-panel">
      <div className="admin-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por e-mail ou nick"/><button onClick={() => reload()}>Buscar</button><select onChange={(e) => reload(search, e.target.value)}><option value="nick">Nick A–Z</option><option value="email">E-mail A–Z</option><option value="created_at">Cadastro recente</option><option value="last_sign_in_at">Último login</option><option value="total_spent">Maior gasto</option></select></div>
      <p>{data.totalUsers} usuárias encontradas</p>
      <div className="admin-table-wrap"><table><thead><tr><th>Usuária</th><th>Cadastro / login</th><th>Compras</th><th>Álbum</th><th>Status</th></tr></thead><tbody>{data.users.map((u: any) => <tr key={u.id}><td><b>@{u.nick || "sem-nick"}</b><small>{u.email}</small><small>{u.id}</small></td><td>{date(u.created_at)}<small>Login: {date(u.last_sign_in_at)}</small></td><td>{money(u.total_spent_cents)}<small>{u.approved_orders} pedidos</small></td><td>{u.distinct_stickers} coladas<small>{u.rare_stickers} raras · {u.repeat_copies} repetidas</small></td><td>{u.banned_until && new Date(u.banned_until) > new Date() ? "Banida" : u.email_confirmed_at ? "Ativa" : "Não confirmada"}</td></tr>)}</tbody></table></div>
    </section>}

    {tab === "sales" && <section className="admin-panel"><div className="admin-table-wrap"><table><thead><tr><th>Pedido</th><th>Itens</th><th>Pagamento</th><th>Valor</th><th>Data</th></tr></thead><tbody>{data.orders.map((o: any) => <tr key={o.id}><td><b>{o.order_code}</b><small>{o.id}</small></td><td>{(o.purchase_order_items || []).map((i: any) => `${i.quantity}x ${i.product_name}`).join(", ")}</td><td>{o.payment_provider}<small>{o.payment_status} · {o.status}</small></td><td>{money(o.amount_due_cents)}<small>{o.points_used || 0} pts · cupom {o.coupon_code || "—"}</small></td><td>{date(o.created_at)}<small>Aprovado: {date(o.payment_approved_at)}</small></td></tr>)}</tbody></table></div></section>}

    {tab === "coupons" && <section className="admin-panel"><h2>{coupon.id ? "Editar cupom" : "Novo cupom"}</h2><div className="admin-form"><label>Nome<input value={coupon.code} onChange={(e) => setCoupon({...coupon,code:e.target.value})}/></label><label>Desconto (%)<input type="number" value={coupon.discountPercent} onChange={(e) => setCoupon({...coupon,discountPercent:Number(e.target.value)})}/></label><label>Validade<input type="datetime-local" value={coupon.expiresAt || ""} onChange={(e) => setCoupon({...coupon,expiresAt:e.target.value})}/></label><label>Limite global<input type="number" value={coupon.maxUses} onChange={(e) => setCoupon({...coupon,maxUses:e.target.value})}/></label><label>Por usuária<input type="number" value={coupon.maxUsesPerUser} onChange={(e) => setCoupon({...coupon,maxUsesPerUser:e.target.value})}/></label><label><input type="checkbox" checked={coupon.active} onChange={(e) => setCoupon({...coupon,active:e.target.checked})}/> Ativo</label><button onClick={() => run(() => saveAdminCoupon({ data: {...coupon,expiresAt:coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,maxUses:coupon.maxUses ? Number(coupon.maxUses) : null,maxUsesPerUser:coupon.maxUsesPerUser ? Number(coupon.maxUsesPerUser) : null} }))}>Salvar</button><button onClick={() => setCoupon({ code: "", discountPercent: 10, expiresAt: "", maxUses: "", maxUsesPerUser: 1, active: true })}>Novo</button></div>
      <div className="admin-cards">{data.coupons.map((c:any)=><article key={c.id}><b>{c.code}</b><span>{c.discount_percent}% · {c.uses_count} usos</span><span>{c.is_active ? "Ativo" : "Pausado"} · até {date(c.expires_at)}</span><div><button onClick={()=>setCoupon({id:c.id,code:c.code,discountPercent:c.discount_percent,expiresAt:c.expires_at?.slice(0,16)||"",maxUses:c.max_uses||"",maxUsesPerUser:c.max_uses_per_user||"",active:c.is_active})}>Editar</button><button onClick={()=>setCoupon({code:`${c.code}COPIA`,discountPercent:c.discount_percent,expiresAt:"",maxUses:c.max_uses||"",maxUsesPerUser:c.max_uses_per_user||1,active:false})}>Duplicar</button><button onClick={()=>run(()=>deleteAdminCoupon({data:{id:c.id}}))}>Pausar</button></div></article>)}</div>
    </section>}

    {tab === "products" && <section className="admin-panel"><h2>{data.products.some((p:any)=>p.id===product.id) ? "Editar produto" : "Novo produto"}</h2><div className="admin-form"><label>ID<input value={product.id} onChange={(e)=>setProduct({...product,id:e.target.value})}/></label><label>Nome<input value={product.name} onChange={(e)=>setProduct({...product,name:e.target.value})}/></label><label>Descrição<textarea value={product.description} onChange={(e)=>setProduct({...product,description:e.target.value})}/></label><label>Imagem (URL/caminho)<input value={product.imageUrl} onChange={(e)=>setProduct({...product,imageUrl:e.target.value})}/></label><label>Preço (R$)<input type="number" step="0.01" value={product.price} onChange={(e)=>setProduct({...product,price:e.target.value})}/></label><label>Pontos<input type="number" value={product.pointPrice} onChange={(e)=>setProduct({...product,pointPrice:e.target.value})}/></label><label>Tipo<select value={product.productType} onChange={(e)=>setProduct({...product,productType:e.target.value})}><option value="pack">Pacote</option><option value="combo">Combo</option><option value="single_random">Unitária</option><option value="exclusive">Exclusiva</option></select></label><label>Pacotes<input type="number" value={product.packCount} onChange={(e)=>setProduct({...product,packCount:Number(e.target.value)})}/></label><label>Figurinhas/pacote<input type="number" value={product.stickersPerPack} onChange={(e)=>setProduct({...product,stickersPerPack:Number(e.target.value)})}/></label><label>Nº exclusiva<input type="number" value={product.stickerNumber} onChange={(e)=>setProduct({...product,stickerNumber:e.target.value})}/></label><label><input type="checkbox" checked={product.active} onChange={(e)=>setProduct({...product,active:e.target.checked})}/> Ativo</label><button onClick={()=>run(()=>saveAdminProduct({data:{...product,stickerNumber:product.stickerNumber?Number(product.stickerNumber):null,priceCents:Math.round(Number(product.price)*100),pointPrice:Number(product.pointPrice||0),sortOrder:Number(product.sortOrder||100)}}))}>Salvar</button></div>
      <div className="admin-cards">{data.products.map((p:any)=><article key={p.id}><b>{p.name}</b><span>{p.id} · {money(p.price_cents)}</span><span>{p.active?"Ativo":"Pausado"} · {p.description}</span><div><button onClick={()=>setProduct({id:p.id,name:p.name,description:p.description||"",productType:p.product_type,stickerNumber:p.sticker_number||"",packCount:p.pack_count,stickersPerPack:p.stickers_per_pack,price:p.price_cents/100,pointPrice:p.point_price,imageUrl:p.image_url||"",displaySection:p.display_section,sortOrder:p.sort_order,active:p.active})}>Editar</button><button onClick={()=>run(()=>archiveAdminProduct({data:{id:p.id}}))}>Pausar</button></div></article>)}</div>
    </section>}
    </div>
  </main>;
}
