import { useEffect, useRef } from 'react';
import { getContractEvents } from '../services/deploy';
import { getExplorerUrl } from '../services/deploy';
import { readEventCursor, writeEventCursor } from '../services/cache';

/**
 * useEventPolling — subscribes to live Soroban contract events.
 *
 * Polls `getContractEvents` every 5 seconds with cursor-based pagination.
 * Cursors are persisted to localStorage per contract so they survive refresh.
 *
 * @param {{
 *   deployedContract: {id: string} | null,
 *   setEventCursor: (cursor: string|null) => void,
 *   eventCursorRef: React.MutableRefObject<string|null>,
 *   setEventSync: (fn: any) => void,
 *   setTransactions: (fn: any) => void,
 *   setCallResult: (result: any) => void,
 * }} params
 */
export function useEventPolling({
  deployedContract,
  setEventCursor,
  eventCursorRef,
  setEventSync,
  setTransactions,
  setCallResult,
}) {
  const pollTimerRef = useRef(null);

  // Reset cursor when the deployed contract changes.
  useEffect(() => {
    if (!deployedContract?.id) {
      setEventCursor(null);
      setEventSync({ live: false, lastLedger: null, error: null });
      return;
    }

    const cursor = readEventCursor(deployedContract.id);
    setEventCursor(cursor);
    eventCursorRef.current = cursor;
  }, [deployedContract?.id]);

  // Live polling loop.
  useEffect(() => {
    if (!deployedContract?.id) return;

    let cancelled = false;

    const scheduleNextPoll = () => {
      if (cancelled) return;
      pollTimerRef.current = setTimeout(pollEvents, 5000);
    };

    const pollEvents = async () => {
      try {
        const response = await getContractEvents(deployedContract.id, {
          cursor: eventCursorRef.current,
          limit: 20,
        });

        if (cancelled) return;

        if (response.cursor && response.cursor !== eventCursorRef.current) {
          setEventCursor(response.cursor);
          eventCursorRef.current = response.cursor;
          writeEventCursor(deployedContract.id, response.cursor);
        }

        if (Array.isArray(response.events) && response.events.length > 0) {
          const eventEntries = response.events.map((event) => ({
            type: 'event',
            eventId: event.id,
            eventType: event.type,
            contractId: event.contractId || deployedContract.id,
            timestamp: event.ledgerClosedAt || new Date().toISOString(),
            hash: event.txHash,
            explorerUrl: getExplorerUrl(event.txHash),
            topic: event.topicNative,
            result: event.valueNative,
          }));

          setTransactions((prev) => {
            const seen = new Set(prev.map((tx) => tx.eventId || tx.hash));
            const incoming = eventEntries.filter((tx) => !seen.has(tx.eventId || tx.hash));
            return incoming.length > 0 ? [...incoming, ...prev].slice(0, 50) : prev;
          });

          const latestEvent = eventEntries[0];
          setCallResult({
            status: 'success',
            result: JSON.stringify(latestEvent.result, null, 2),
          });
        }

        setEventSync({
          live: true,
          lastLedger: response.latestLedger || null,
          error: null,
        });
      } catch (error) {
        if (!cancelled) {
          setEventSync((prev) => ({ ...prev, live: false, error: error.message }));
        }
      } finally {
        scheduleNextPoll();
      }
    };

    pollEvents();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [deployedContract?.id]);
}
