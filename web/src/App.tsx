import { useMemo, useState } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';

import { useClients } from './hooks/useClients';
import { Message, useMessages, useSendMessage } from './hooks/useMessages';

interface ClientRow {
  id: string;
  name?: string | null;
  phoneNumber: string;
  messagesCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

const columns: ColumnDef<ClientRow>[] = [
  {
    header: 'Cliente',
    accessorKey: 'name',
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-slate-900">{row.original.name ?? 'Contato sem nome'}</p>
        <p className="text-xs text-slate-500">{row.original.phoneNumber}</p>
      </div>
    ),
  },
  {
    header: 'Última mensagem',
    accessorKey: 'lastMessagePreview',
    cell: ({ row }) => (
      <div className="text-sm text-slate-600 overflow-hidden text-ellipsis">{row.original.lastMessagePreview ?? '—'}</div>
    ),
  },
  {
    header: 'Atualizado',
    accessorKey: 'lastMessageAt',
    cell: ({ row }) => (
      <span className="text-sm text-slate-500">
        {row.original.lastMessageAt
          ? formatDistanceToNow(new Date(row.original.lastMessageAt), { addSuffix: true, locale: ptBR })
          : 'Sem registros'}
      </span>
    ),
  },
  {
    header: 'Conversas',
    accessorKey: 'messagesCount',
    cell: ({ row }) => <span className="text-sm font-medium text-slate-700">{row.original.messagesCount}</span>,
  },
];

function Conversation({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-md rounded-lg px-4 py-3 text-sm shadow-sm ${
            message.direction === 'OUTBOUND' ? 'self-end bg-blue-600 text-white' : 'self-start bg-white text-slate-900'
          }`}
        >
          <p>{message.content}</p>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
            {new Date(message.createdAt).toLocaleString('pt-BR')}
            {message.aiModel ? ` · ${message.aiModel}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageComposer({ contactId }: { contactId: string }) {
  const [message, setMessage] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [context, setContext] = useState('');
  const sendMessage = useSendMessage(contactId);

  const isLoading = sendMessage.isPending;

  return (
    <form
      className="flex flex-col gap-3 border-t border-slate-200 bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!message.trim()) return;

        await sendMessage.mutateAsync({ message, useAI, context });
        setMessage('');
      }}
    >
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(event) => setUseAI(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Responder com IA (OpenAI)
        </label>
        <Sparkles className={`h-4 w-4 ${useAI ? 'text-amber-500' : 'text-slate-400'}`} />
      </div>

      {useAI && (
        <textarea
          className="h-20 w-full resize-none rounded-md border border-slate-200 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Contexto adicional para a IA (opcional)"
          value={context}
          onChange={(event) => setContext(event.target.value)}
        />
      )}

      <div className="flex gap-2">
        <textarea
          className="h-24 flex-1 resize-none rounded-md border border-slate-200 p-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Digite sua mensagem"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-28 items-center justify-center gap-2 rounded-md bg-blue-600 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar
        </button>
      </div>

      {sendMessage.isError && (
        <p className="text-sm text-red-500">Erro ao enviar mensagem. Verifique as integrações.</p>
      )}
    </form>
  );
}

function App() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: messages, isLoading: isLoadingMessages } = useMessages(selectedClientId ?? undefined);

  const table = useReactTable({
    data: clients ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedClient = useMemo(() => clients?.find((client) => client.id === selectedClientId), [
    clients,
    selectedClientId,
  ]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-[420px] flex-col border-r border-slate-200 bg-white">
        <header className="flex items-center gap-2 border-b border-slate-200 p-4">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">ContrataMais</h1>
            <p className="text-xs text-slate-500">Central de Conversas</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {isLoadingClients ? (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="border-b border-slate-200 px-4 py-3">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedClientId(row.original.id)}
                    className={`cursor-pointer transition hover:bg-blue-50 ${
                      selectedClientId === row.original.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="border-b border-slate-100 px-4 py-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        {selectedClient ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{selectedClient.name ?? 'Contato sem nome'}</h2>
                <p className="text-sm text-slate-500">{selectedClient.phoneNumber}</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {selectedClient.messagesCount} mensagens
              </div>
            </div>
            <section className="flex-1 overflow-y-auto bg-slate-50">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages && messages.length > 0 ? (
                <Conversation messages={messages} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
                  <MessageCircle className="h-12 w-12 opacity-40" />
                  <p className="text-sm">Nenhuma mensagem registrada ainda.</p>
                </div>
              )}
            </section>
            <MessageComposer contactId={selectedClient.id} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
            <MessageCircle className="h-12 w-12 opacity-40" />
            <p className="text-sm">Selecione um cliente na lista para visualizar a conversa.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
