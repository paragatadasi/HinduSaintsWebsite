"use client";
import {SpnLinkedLocalityMap} from './spn-linked-locality-map';
import {localitiesForSaints, saintHasLocality} from '@/lib/spn-linked-localities';
import {MuseumGuideFamilyTree} from "./museum-guide-family-tree";
import type {GuideEntry,GuideGroup} from "@/lib/spn-move-guide";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, ArrowRight, Star, GitBranch, Check, RotateCcw, RotateCw } from 'lucide-react';
import { spnProposalLabels as proposalLabels } from '@/lib/spn-proposal-labels';
import type baselineData from '@/data/museum/spn-room-proposal-v15.json';

import { explorerSaints, proposalVersionLabel, vitrineConnectionPlaces, vitrineNeighborhoods, type ExplorerSaint, type ExplorerDriver, type ExplorerOption, type ExplorerPlacement } from '@/lib/spn-room-explorer';
import { sourceContextFit, type SourceContextFit, type ExplorerObservation } from '@/lib/spn-room-proposal';
import '@/styles/spn-room-explorer.css';
type Proposal = Pick<typeof baselineData, 'version' | 'title' | 'snapshotAt' | 'layout'> & {
    visitorStoryRoute?:{title:string;cases:number[];story:string;people:string}[];
    tertiaryCityClusters?:{vitrine:number;groups:{city:string;members:{saintId:string;name:string}[]}[]}[];
    cityReview?:{city:string;remainingSplit:boolean;reasons:string[];afterVitrines:Record<string,number|undefined>}[];
    reviewedFamilies?:{code:string;families:GuideGroup[];entries:GuideEntry[]}[];
    pendingPlacements?:{sourceId:string;name:string;previousVitrine:string;reason:string}[];
    liveEstimates?:boolean;
    reviewStatus?: string;
    reviewNote?: string;
    indicators: (SourceContextFit & {unresolvedDisplayBand?:string|null;vitrine:string;hasUnresolvedHoldings:boolean;unresolvedSourceObservationCount:number;potentialFlexibleSpace:boolean;specialFitNote:string|null})[];
};
type Direction = 'north' | 'east' | 'south' | 'west';
type ProposalChoice = {
    id: string;
    label: string;
    group: 'candidate' | 'earlier';
    archived: boolean;
    option: ExplorerOption;
};
import portraitData from '@/data/museum/spn-room-explorer-portraits.json';
const portraits: Record<string, {
    image: string;
    href: string;
}> = portraitData;
function Portrait({ saint }: {
    saint: ExplorerSaint;
}) { const [failed, setFailed] = useState(false); const photo = portraits[saint.saintId]; return photo && !failed ? <img className="saint-portrait" src={photo.image} alt="" width="64" height="80" loading="lazy" onError={() => setFailed(true)}/> : <span className="saint-portrait portrait-empty" aria-hidden="true"/>; }
const regions: Record<string, string> = { N: 'Himalaya & the North', B: 'Braj & the Ganga', W: 'Maharashtra & the West', E: 'Bengal, Odisha & the East', S: 'The South', K: 'Sikh Gurus & Udasin', C: 'Bhakti Marga & global context', R: 'Flexible space', L: 'Large objects', T: 'Walking sticks' };
const short: Record<string, string> = { N: 'North', B: 'Braj & Ganga', W: 'West', E: 'East', S: 'South', K: 'Sikh & Udasin', C: 'Global', R: 'Reserve', L: 'Large objects', T: 'Sticks' };
const geo = (v: Proposal['layout']['vitrines'][number]) => ({ x: (v.row - 1) * 16 + 32, y: (25 - v.column - v.columnSpan) * 17 + 38, w: v.rowSpan * 16 - 5, h: v.columnSpan * 17 - 5 });
const queryLowerSafe = (q: string) => q.toLowerCase().trim();
const bridgePlaces = (d: ExplorerDriver) => vitrineConnectionPlaces(d);
const bridgeLabel = (d: ExplorerDriver, n: string | number) => d.connection === 'Gaudiya ↔ Puri; Kriya ↔ Ramakrishna' ? (['5', '57'].includes(String(n)) ? 'Kriya ↔ Ramakrishna' : 'Gaudiya ↔ Puri') : d.connection;
const orientations = { north: { label: 'Up', angle: 90, transform: 'translate(470 0) rotate(90)', viewBox: '0 0 470 740', cave: '↑', entry: '↓' }, east: { label: 'Right', angle: 180, transform: 'translate(740 470) rotate(180)', viewBox: '0 0 740 470', cave: '→', entry: '←' }, south: { label: 'Down', angle: 270, transform: 'translate(0 740) rotate(270)', viewBox: '0 0 470 740', cave: '↓', entry: '↑' }, west: { label: 'Left', angle: 0, transform: '', viewBox: '0 0 740 470', cave: '←', entry: '→' } };
const named = (o: ExplorerOption, n: string | number) => o.primeAnchors[n]?.people || '';
export type ExplorerRelease = {
    proposal: Proposal;
    rows: ExplorerObservation[];
    designData: {options:ExplorerOption[];comparisonPrevious:ExplorerOption;placements:ExplorerPlacement[];heldCases?:{case:string;status:string;saintIds:string[];destination:number;reason:string}[]};
};
export function SpnRoomExplorer({releases}: {releases: ExplorerRelease[]}) {
    const [proposalId, setProposalId] = useState(releases[0].designData.options[0].id);
    const active = releases.find(r => r.designData.options.some(o => o.id === proposalId)) ?? releases[0];
    const {proposal, rows, designData} = active;
    const baseline = designData.options[0], previous = releases[0].designData.comparisonPrevious;
    const versionLabel = proposalLabels[proposalId]?.versionLabel ?? proposalVersionLabel(proposal.version);
    const proposals: ProposalChoice[] = [...releases.flatMap(r => r.designData.options.map(option => {
        const display = proposalLabels[option.id] ?? {label: option.title + ' · ' + proposalVersionLabel(r.proposal.version), group: 'earlier' as const};
        return {id: option.id, label: display.label, group: display.group, archived: false, option};
    })), {id: 'archived-earlier', ...proposalLabels['archived-earlier'], archived: true, option: previous}]
        .sort((a, b) => Number(a.group === 'earlier') - Number(b.group === 'earlier'));
    const data = {proposal, inventory:explorerSaints(rows), indicators:proposal.indicators};
    const vitrine = (n:string|number) => proposal.layout.vitrines.find(v=>v.number===String(n))!;
    const changedCases = new Set(rows.filter(r=>r.reviewReason).flatMap(r=>[r.vitrine,r.effectiveVitrine]));
    const designPlacements = designData.placements;
    const currentChanges = rows.filter(r=>r.reviewReason);
    const [placeFilter, setPlaceFilter] = useState<{vitrine:string;proposal:string;id:string}|null>(null);
    const [caveDirection, setCaveDirection] = useState<Direction>('north');
    const orientation = orientations[caveDirection];
    const frame = orientation.angle % 180 ? { width: 470, height: 740 } : { width: 740, height: 470 };
    const caveLabel = { north: [235, -28], east: [785, 235], south: [235, 782], west: [-45, 235] }[caveDirection];
    const entryLabel = { north: [235, 782], east: [-45, 235], south: [235, -28], west: [785, 235] }[caveDirection];
    const [comparisonId, setComparisonId] = useState(releases[1]?.designData.options[0].id ?? 'archived-earlier'), [selected, setSelected] = useState('5'), [driver, setDriver] = useState<number | null>(null), [query, setQuery] = useState(''), [lens, setLens] = useState('sections'), [compare, setCompare] = useState(false), [list, setList] = useState(false), [shortlist, setShortlist] = useState<Record<string, boolean>>({});
    const selectedPlace = placeFilter?.vitrine===selected && placeFilter?.proposal===proposalId ? placeFilter.id : null;
    const current = proposals.find(p => p.id === proposalId) ?? proposals[0], option = current.option, archived = current.archived, favorite = !!shortlist[proposalId];
    const comparison = proposals.find(p => p.id === comparisonId) || proposals.find(p => p.id !== proposalId)!;
    const sectionResults = queryLowerSafe(query) ? option.displayPackets.filter(p => p.navigationKind === 'neighborhood' && ((p.label + ' ' + regions[p.group]).toLowerCase().includes(queryLowerSafe(query)))) : [];
    const assignment = option.assignments.find(a => a.number === selected);
    const neighborhoods = vitrineNeighborhoods(option, selected);
    const chosenDriver = driver === null ? null : option.drivers[driver];
    const selectedCases = chosenDriver?.places?.map(String) || [selected];
    const primary = data.inventory.filter(s => s.tier === 'Primary' && !s.sourceAttributionHold);
    const placements = archived ? [] : designPlacements;
    const placementFor = (s: ExplorerSaint) => { const p = placements.find(p => p.saintId === s.saintId); return s.caseEnvelope[0] ? { ...p, saintId: s.saintId, vitrine: s.caseEnvelope[0] } : undefined; };
    const primariesIn = (n: string | number) => primary.filter(s => s.caseEnvelope.includes(String(n))).sort((a, b) => (placementFor(a)?.priority || 99) - (placementFor(b)?.priority || 99));
    const bridgesIn = (n: string | number) => option.drivers.filter(d => (d.connectionKind === 'thematic' || /↔|Vraj → Rama → Kashi|Nath → Dnyaneshwar → Varkari/.test(d.connection)) && bridgePlaces(d).map(String).includes(String(n)));
    const queryLower = query.toLowerCase().trim();
    const results = queryLower ? data.inventory.filter(s => (s.name + ' ' + s.currentSections.join(' ') + ' ' + s.recommendedRegion).toLowerCase().includes(queryLower)) : [];
    const changed = option.assignments.filter(a => { let before = comparison.option.assignments.find(b => b.number === a.number); return before?.subsection !== a.subsection; });
    function orient(key: Direction, focus = false) { setCaveDirection(key); localStorage.setItem('spn-explorer-cave-direction', key); if (focus)
        requestAnimationFrame(() => document.querySelector(`.compass-${key}`)?.scrollIntoView({ block: 'nearest' })); }
    function choose(n: string | number) { setPlaceFilter(null); setSelected(String(n)); setDriver(null); }
    function resetProposal(value: string) { setPlaceFilter(null); if (value === comparisonId)
        setComparisonId(proposalId); setProposalId(value); setDriver(null); setQuery(''); }
    useEffect(() => { try {
        const saved = localStorage.getItem('spn-explorer-cave-direction');
        if (saved && saved in orientations)
            setCaveDirection(saved as Direction);
        const savedShortlist = JSON.parse(localStorage.getItem('spn-explorer-shortlists') || '{}') as Record<string, unknown>;
        setShortlist(Object.fromEntries(Object.entries(savedShortlist).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean>);
    }
    catch {
        setShortlist({});
    } }, []);
    function CaseButtons({ numbers }: {
        numbers: (string | number)[];
    }) { return <div className="case-links">{numbers.map(n => <button key={n} onClick={() => choose(n)} aria-pressed={selected === String(n)}>V{n}</button>)}</div>; }
    function Map() {
        const [hover, setHover] = useState<{
            number: string;
            left: number;
            top: number;
        } | null>(null), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), warm = useRef(false);
        function dismiss() { clearTimeout(timer.current); setHover(null); warm.current = false; }
        function leave() { clearTimeout(timer.current); timer.current = setTimeout(() => { setHover(null); warm.current = false; }, 300); }
        function reveal(e: React.PointerEvent<SVGGElement> | React.FocusEvent<SVGGElement>, n: string, immediate = false) { if (!immediate && (('pointerType' in e && e.pointerType === 'touch') || !matchMedia('(hover: hover)').matches))
            return; clearTimeout(timer.current); const target = e.currentTarget; timer.current = setTimeout(() => { const rect = target.getBoundingClientRect(); setHover({ number: n, left: Math.max(12, Math.min(rect.right + 12, innerWidth - 304)), top: Math.max(12, Math.min(rect.top, innerHeight - 370)) }); warm.current = true; }, immediate ? 80 : warm.current ? 0 : 220); }
        useEffect(() => { function key(e: KeyboardEvent) { if (e.key === 'Escape')
            dismiss(); } function scroll() { setHover(null); } addEventListener('keydown', key); addEventListener('scroll', scroll, true); return () => { clearTimeout(timer.current); removeEventListener('keydown', key); removeEventListener('scroll', scroll, true); }; }, []);
        const hovered = hover && option.assignments.find(a => a.number === hover.number), hoverExact = hover ? primariesIn(hover.number) : [], hoverSaints = hover ? (primariesIn(hover.number).length ? primariesIn(hover.number) : archived ? [] : primary.filter(s => s.caseEnvelope.map(String).includes(hover.number)).sort((a, b) => { const keywords = named(option, hover.number).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3 && !['family', 'immediate', 'together'].includes(w)); return Number(keywords.some(w => b.name.toLowerCase().includes(w))) - Number(keywords.some(w => a.name.toLowerCase().includes(w))); })).slice(0, 3) : [], hoverBridges = hover ? bridgesIn(hover.number) : [];
        return <section className="panel map-panel"><div className="panel-heading"><div><p className="eyebrow">Room explorer</p><h2>Proposed layout</h2></div><button className="quiet" onClick={() => setList(!list)}>{list ? 'Show map' : 'Show list'}</button></div><div className="map-controls"><div className="lenses" aria-label="Map emphasis">{[['sections', 'Sections'], ['primary', 'Primary saints'], ['connections', 'Connections']].map(([id, label]) => <button key={id} aria-pressed={lens === id} onClick={() => setLens(id)}>{label}</button>)}</div>
 {!list ? <div className="orientation-control control-2"><div className="turn-controls" role="group" aria-label="Rotate room view"><button aria-label="Turn view anticlockwise" onClick={() => { const keys: Direction[] = ['north', 'east', 'south', 'west']; orient(keys[(keys.indexOf(caveDirection) + 3) % 4]); }}><RotateCcw size={18}/></button><span aria-live="polite"><small>Cave</small>{orientation.label}</span><button aria-label="Turn view clockwise" onClick={() => { const keys: Direction[] = ['north', 'east', 'south', 'west']; orient(keys[(keys.indexOf(caveDirection) + 1) % 4]); }}><RotateCw size={18}/></button></div></div> : null}</div>
 {chosenDriver ? <p className="caption">Gold lines show the selected placement rationale, not family membership. Dashed lines show thematic, optional continuation or cross-room links.</p> : null}
 {list ? <div className="case-directory">{option.assignments.map(a => <button className={'directory-row tone-' + a.group} key={a.number} onClick={() => choose(a.number)}><b>V{a.number}</b><span>{a.subsection}</span><ArrowRight size={16}/></button>)}</div> : <div className="map-scroll"><svg viewBox={orientation.angle % 180 ? `0 -60 ${frame.width} ${frame.height + 120}` : `-100 0 ${frame.width + 200} ${frame.height}`} className={'floorplan orientation-' + caveDirection} aria-label={'SPN proposed display areas · Babaji Cave ' + orientation.label}><g transform={orientation.transform}><path className="room" d="M32 432V105H440V20H704V432Z"/>
 {data.proposal.layout.vitrines.map(v => { let a = option.assignments.find(x => x.number === v.number), g = geo(v), focus = selectedCases.includes(v.number), isPrimary = primariesIn(v.number).length > 0, dim = lens === 'primary' && !isPrimary; return <g key={v.number} className={'case tone-' + (a?.group || 'R') + (focus ? ' chosen' : '') + (v.availability === 'future' ? ' future' : '') + (dim ? ' subdued' : '')} role="button" tabIndex={0} aria-label={`Vitrine ${v.number}${v.provisional ? ', provisional number' : ''}: ${a?.subsection || 'Future space'}`} aria-pressed={v.number === selected} aria-describedby={hover?.number === v.number ? 'vitrine-hover' : undefined} onPointerEnter={e => reveal(e, v.number)} onPointerLeave={leave} onFocus={e => reveal(e, v.number, true)} onBlur={dismiss} onClick={() => choose(v.number)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                choose(v.number);
            } }}><rect x={g.x} y={g.y} width={g.w} height={g.h} rx="3"/><text x={g.x + g.w / 2} y={g.y + g.h / 2} dominantBaseline="central" transform={`rotate(${-orientation.angle} ${g.x + g.w / 2} ${g.y + g.h / 2})`}>{v.number}{v.provisional ? '*' : ''}</text>{bridgesIn(v.number).length ? <circle className="bridge-dot" cx={g.x + g.w - 5} cy={g.y + 5} r="2.5"/> : null}{compare && changed.some(x => x.number === v.number) ? <path className="change-mark" d={`M${g.x + 4} ${g.y + g.h - 4}h${g.w - 8}`}/> : null}</g>; })}
 {chosenDriver ? <g className="route-lines">{chosenDriver.places.slice(1).map((n, i) => { if (/cross-room/.test(chosenDriver.reason) && i % 2 === 1)
                return null; let a = geo(vitrine(chosenDriver.places[i])), b = geo(vitrine(n)); return <path key={i} d={`M${a.x + a.w / 2} ${a.y + a.h / 2}L${b.x + b.w / 2} ${b.y + b.h / 2}`} className={(/cross-room|weaker/.test(chosenDriver.reason) || !!chosenDriver.contextPlaces?.length || chosenDriver.connectionKind === 'thematic') ? 'cross-room' : ''}/>; })}</g> : null}
 </g><text x={caveLabel[0]} y={caveLabel[1]} textAnchor="middle" className="map-landmark"><tspan x={caveLabel[0]}>{orientation.cave}</tspan><tspan x={caveLabel[0]} dy="18">Babaji Cave</tspan></text><text x={entryLabel[0]} y={entryLabel[1]} textAnchor="middle" className="map-landmark"><tspan x={entryLabel[0]}>{orientation.entry}</tspan><tspan x={entryLabel[0]} dy="18">Entrance</tspan></text></svg></div>}
 <div className="legend">{Object.entries(regions).slice(0, 7).map(([g, label]) => <button key={g} className={'tone-' + g} onClick={() => choose(option.assignments.find(a => a.group === g)?.number || '5')}><i />{short[g]}</button>)}</div><div className="symbol-legend" aria-label="Map symbols"><span><i className="symbol-bridge" aria-hidden="true"/>Key bridge</span><span><i className="symbol-provisional" aria-hidden="true">*</i>Provisional number</span><span><i className="symbol-future" aria-hidden="true"/>Future space</span>{compare ? <span><i className="symbol-change" aria-hidden="true"/>Changed allocation</span> : null}</div><p className="caption">{lens === 'primary' ? 'Highlighted vitrines have a proposed primary saint. Select one to see who is proposed here.' : 'Select a vitrine to see its section, saints, and placement rationale.'}</p>
 {hover ? createPortal(<div id="vitrine-hover" role="tooltip" className={'spn-room-explorer vitrine-hover tone-' + (hovered?.group || 'R')} style={{ left: hover.left, top: hover.top }} onPointerEnter={() => clearTimeout(timer.current)} onPointerLeave={leave}><p className="eyebrow">Vitrine {hover.number}{vitrine(hover.number)?.provisional ? '*' : ''} · {hovered ? short[hovered.group] : 'Future space'}</p><h3>{hovered ? hovered.subsection.split(':')[0].split(';')[0] : 'Not available for this reorganization'}</h3>{hovered ? <><p className="hover-label">{hoverExact.length ? 'Proposed in this vitrine' : 'Primary saints in the area'}</p>{hoverSaints.length ? <ul>{hoverSaints.map(s => <li key={s.saintId}>{s.name}</li>)}</ul> : <p className="caption">{archived ? 'Individual placements are not mapped in this archived study.' : 'No primary saints listed for this area.'}</p>}{!archived && !hoverExact.length && hoverSaints.length ? <p className="placement-pending">Specific vitrines are still being refined.</p> : null}{hoverBridges.length ? <div className="hover-bridges"><span className="hover-label"><i className="symbol-bridge"/>Key bridges</span>{hoverBridges.map(d => <p key={d.connection}>{bridgeLabel(d, hover.number)}</p>)}</div> : null}</> : null}</div>, document.body) : null}
 </section>;
    }
    function SaintList({ saints, empty }: {
        saints: ExplorerSaint[];
        empty?: string;
    }) { return <div className="saint-list">{saints.length ? saints.map(s => { const p = placementFor(s); return <details className="saint-portrait-row" key={s.saintId}><summary><Portrait saint={s}/><span className="saint-row-copy"><span className="saint-row-name">{s.name}</span><small>{s.tier}{p?.vitrine ? ' · V' + p.vitrine : ''}</small></span><ChevronDown className="saint-row-chevron" size={16} aria-hidden="true"/></summary>{p ? <><p>{p.rationale || p.basis}</p>{p.fitNote ? <p>{p.fitNote}</p> : null}</> : <p>Proposed in {s.caseEnvelope.map(n => 'V' + n).join(', ')}. {s.sourceAttributionHold ? 'Identity remains under review.' : 'Exact shelf and fit to confirm.'}</p>}{s.observations.filter(r => r.reviewReason).map(r => <p key={r.sourceId || r.saintId} className="caption">{r.reviewReason}. {versionLabel.toUpperCase()} suggests V{r.vitrine}; {r.currentVitrine ? 'saved destination V' + r.currentVitrine : 'current curator record retained'}.</p>)}<p>Current source record: {s.sourceLocations.map(l => `V${l.vitrine}${l.shelf ? ' / Shelf ' + l.shelf : ''}`).join(' · ') || 'Location not recorded'}</p>{s.sourceAttributionHold ? <p>Source attribution needs review.</p> : null}</details>; }) : <p className="caption">{empty}</p>}</div>; }
    function Inspector() {
        const indicator = archived ? undefined : data.indicators.find(i => String(i.vitrine) === selected);
        const fit=sourceContextFit(indicator,!!proposal.liveEstimates?false:changedCases.has(selected));
        let saints = archived ? [] : data.inventory.filter(s => s.caseEnvelope.map(String).includes(selected));
        const totalSaints = saints.length;
        const places = localitiesForSaints(saints,selected);
        const unmapped = saints.filter(s=>!places.some(p=>saintHasLocality(s,selected,p.id))).length;
        if(selectedPlace) saints=saints.filter(s=>saintHasLocality(s,selected,selectedPlace));
        let anchors = archived ? [] : data.inventory.filter(s => s.tier === 'Primary' && !s.sourceAttributionHold && s.caseEnvelope.some(n => neighborhoods.some(p => p.cases.map(String).includes(String(n)))));
        let drivers = option.drivers.map((d, i) => ({ ...d, index: i })).filter(d => vitrineConnectionPlaces(d).map(String).includes(selected));
        const localDriver = chosenDriver && drivers.some(d => d.index === driver) ? chosenDriver : null;
        return <aside className={'panel inspector tone-' + (assignment?.group || 'R')} aria-label="Selected vitrine"><p className="eyebrow">{assignment?.region || 'Future space'}</p><h2>Vitrine {selected}{vitrine(selected)?.provisional ? '*' : ''}</h2>{!assignment ? <p>This future space is excluded from the current reorganization.</p> : <><h3>{assignment.subsection}</h3><div className="reason vitrine-totals"><p className="eyebrow">Saints &amp; shelf estimate</p><p>{totalSaints} saints{fit ? ` · ${fit.estimate.toFixed(2)} of 5 shelf-height spaces` : ""}</p>{fit && (fit.unknown>0 || fit.namedUnknown>0)?<p className="caption">{fit.unknown + fit.namedUnknown} entries still need a size check.</p>:null}</div>{selectedPlace?<div className="locality-filter"><span>{places.find(p=>p.id===selectedPlace)?.label} · {saints.length} saints</span><button className="quiet" onClick={()=>setPlaceFilter(null)}>Show all</button></div>:null}{unmapped>0?<p className="caption">{unmapped} without mapped places</p>:null}{neighborhoods.filter(p=>p.cases.length>1).map(p=><details className="unplaced-primary" key={p.unitId || p.label}><summary>Regional neighborhood · {p.label}</summary><CaseButtons numbers={p.cases}/></details>)}
 {localDriver ? <div className="reason"><p className="eyebrow">Why these displays connect</p><h3>{localDriver.connection}</h3><p>{localDriver.reason}</p><span className="tag">{localDriver.connectionKind === 'thematic' ? 'Thematic connection' : /cross-room|weaker/.test(localDriver.reason) ? 'Cross-room link' : 'Neighborhood rationale'}</span>{localDriver.sources?.length ? <details><summary>Research sources</summary>{localDriver.sources.map((s, i) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">Source {i + 1} ↗</a>)}</details> : null}</div> : drivers.length ? <div className="reason"><p className="eyebrow">Connections</p>{drivers.map(d => <button className="reason-link" key={d.index} onClick={() => { setDriver(d.index); setLens('connections'); }}><GitBranch size={16}/><span>{d.connection}</span><ArrowRight size={15}/></button>)}</div> : null}
 {option.drivers.filter(d=>d.contextPlaces?.map(String).includes(selected)).map(d=><div className="reason" key={d.connection}><p className="eyebrow">Possible continuation</p><p className="caption">{d.reason}</p><CaseButtons numbers={vitrineConnectionPlaces(d)}/></div>)}
 {proposal.visitorStoryRoute?.filter(stop=>stop.cases.map(String).includes(selected)).map(stop=><details className="reason" key={stop.title}><summary>{stop.title}</summary><p>{stop.story}</p></details>)}
 {!selectedPlace && proposal.tertiaryCityClusters?.filter(c=>String(c.vitrine)===selected).flatMap(c=>c.groups).map(group=>{const members=group.members.filter(m=>saints.some(s=>s.saintId===m.saintId));return members.length?<details className="reason" key={group.city}><summary>{group.city} · {members.length} contextual saints</summary><p className="caption">Reported place context; not a confirmed lineage.</p>{members.map(m=><p key={m.saintId}>{m.name}</p>)}</details>:null})}
 {!selectedPlace && proposal.reviewedFamilies?.filter(v=>v.code===selected).map(v=><section key={v.code} className="reason"><h3>Approved family connections</h3>{v.families.filter(g=>g.edges?.length).map(group=><div key={group.id}><h4>{group.title}</h4><MuseumGuideFamilyTree group={group} entries={new globalThis.Map(v.entries.map(entry=>[entry.sourceId,entry]))} showLocations={false}/></div>)}</section>)}
 {!archived ? <><div className="subheading"><h3>Primary saints here</h3><span>{saints.filter(s=>s.tier==='Primary'&&!s.sourceAttributionHold).length}</span></div><SaintList saints={saints.filter(s=>s.tier==='Primary'&&!s.sourceAttributionHold)} empty="No primary saints proposed in this vitrine."/>
 {!selectedPlace && anchors.filter(s => placementFor(s)?.vitrine && String(placementFor(s)?.vitrine) !== selected).length ? <details className="unplaced-primary"><summary>Primary saints nearby</summary><div className="subheading"><h3>In nearby vitrines</h3><span>{anchors.filter(s => placementFor(s)?.vitrine && String(placementFor(s)?.vitrine) !== selected).length}</span></div><SaintList saints={anchors.filter(s => placementFor(s)?.vitrine && String(placementFor(s)?.vitrine) !== selected)}/></details> : null}
 {anchors.some(s => !placementFor(s)?.vitrine) ? <details className="unplaced-primary"><summary>Neighborhood primary saints · vitrine pending ({anchors.filter(s => !placementFor(s)?.vitrine).length})</summary><SaintList saints={anchors.filter(s => !placementFor(s)?.vitrine)}/></details> : null}
 <details className="unplaced-primary"><summary>Other saints proposed here ({saints.filter(s => s.tier !== 'Primary' && !s.sourceAttributionHold).length})</summary><SaintList saints={saints.filter(s => s.tier !== 'Primary' && !s.sourceAttributionHold).sort((a, b) => Number(b.tier === 'Secondary') - Number(a.tier === 'Secondary'))}/></details>
 {indicator?.hasUnresolvedHoldings ? <details className="unplaced-primary"><summary>Identity under review{indicator.unresolvedDisplayBand ? ` · ${indicator.unresolvedDisplayBand}` : ""} ({indicator.unresolvedSourceObservationCount} records)</summary><p className="caption">These records remain separate from the host tradition while their identities are reviewed.</p><SaintList saints={saints.filter(s => s.sourceAttributionHold)}/></details> : null}
 {designData.heldCases?.filter(c => c.saintIds.some(id => saints.some(s => s.saintId === id))).map(c => <details className="unplaced-primary" key={c.case}><summary>{c.case} · review pending</summary><p>{c.status}</p><p className="caption">{c.reason}</p></details>)}
 {indicator?.specialFitNote ? <p className="caption">{indicator.specialFitNote}</p> : null}
 <p className="caption inspector-footnote">Inventory snapshot: {new Date(proposal.snapshotAt).toLocaleDateString('en-GB', {day:'numeric',month:'short',timeZone:'UTC'})}</p></> : <p className="caption">Archived study. Individual saint allocations are not shown against the newer inventory mapping.</p>}
 </>}</aside>;
    }
    return <section className="spn-room-explorer" aria-label="SPN room proposal explorer"><header className="page-title"><div><p className="eyebrow">SPN · Plan the space</p><h1>Explore arrangements</h1><p>Explore the room, find primary saints, and follow the connections between displays.</p></div><span className="tag">{archived ? "Earlier design study" : "Proposal · " + versionLabel}</span></header>
 {!archived && proposal.reviewNote ? <p className="panel review-note" role="status">{proposal.reviewNote}</p> : null}
 {currentChanges.length ? <details className="panel review-note"><summary>{currentChanges.length} entries have newer curator decisions</summary><p>Current names, tiers and saved destinations are retained. Review these differences before moving anything; space estimates are withheld in affected vitrines.</p>{currentChanges.map(r => <p key={r.sourceId || r.saintId}>{r.name} · {r.reviewReason}</p>)}</details> : null}
 {proposal.pendingPlacements?.length?<details className="panel"><summary>Separate placement review ({proposal.pendingPlacements.length})</summary>{proposal.pendingPlacements.map(row=><p key={row.sourceId}>{row.name} · {row.reason} · previous proposal: Vitrine {row.previousVitrine}</p>)}</details>:null}<section className="proposal-head panel"><div><label htmlFor="proposal">Viewing proposal</label><select id="proposal" value={proposalId} onChange={e => resetProposal(e.target.value)}><optgroup label="Candidates">{proposals.filter(p => p.group === 'candidate').map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup><optgroup label="Earlier studies">{proposals.filter(p => p.group === 'earlier').map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup></select><p className="caption">Original study ID: <code>{option.id}</code></p></div><div className="proposal-actions"><button className={favorite ? 'saved' : 'primary'} onClick={() => { const next = { ...shortlist, [proposalId]: !favorite }; setShortlist(next); localStorage.setItem('spn-explorer-shortlists', JSON.stringify(next)); }}>{favorite ? <Check size={16}/> : <Star size={16}/>} {favorite ? 'Shortlisted in this browser' : 'Shortlist for discussion'}</button><label className="check"><input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)}/>Compare proposals</label>{compare ? <div><label htmlFor="comparison">Compare against</label><select id="comparison" value={comparisonId} onChange={e => setComparisonId(e.target.value)}><optgroup label="Candidates">{proposals.filter(p => p.id !== proposalId && p.group === 'candidate').map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup><optgroup label="Earlier studies">{proposals.filter(p => p.id !== proposalId && p.group === 'earlier').map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</optgroup></select></div> : null}</div></section>

 {proposal.cityReview?<details className="panel"><summary>City groups still spread across vitrines ({proposal.cityReview.filter(c=>c.remainingSplit).length})</summary><p>Family connections, regional context and space take priority over complete city grouping.</p>{proposal.cityReview.filter(c=>c.remainingSplit).map(c=><details key={c.city}><summary>{c.city} · {Object.keys(c.afterVitrines).map(v=>'V'+v).join(', ')}</summary><p>{c.reasons.join('. ')}</p></details>)}</details>:null}
 {proposal.visitorStoryRoute?<details className="panel"><summary>A pilgrimage through the museum</summary><p className="caption">Explore the proposed route and its regional connections.</p><iframe className="spn-pilgrimage-frame" title="Museum pilgrimage companion" src="/museumadmin/plan/pilgrimage" sandbox="allow-scripts" loading="lazy"/></details>:null}
 <div className="toolbar"><form role="search" onSubmit={e => { e.preventDefault(); if (results[0])
        choose(results[0].caseEnvelope[0]); }}><label htmlFor="search">Find a saint or section</label><div className="search-wrap"><Search size={17}/><input id="search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try Yogananda, Varkari, or Sikh…" autoComplete="off"/></div></form><p className="caption"><b>82</b> available vitrines <span>·</span> <b>3</b> future spaces excluded <span>·</span> <b>{primary.length}</b> primary saints</p></div>
 {queryLower ? <section className="panel results" aria-label="Search results"><p className="eyebrow">Matching areas in this proposal</p>{sectionResults.map((p, i) => <button className="result" key={i} onClick={() => { choose(p.cases[0]); setQuery(''); }}><span><b>{p.label}</b><small>{regions[p.group]}</small></span><span className="caption">{p.cases.map(n => 'V' + n).join(', ')}</span></button>)}{!sectionResults.length ? <p className="caption">No matching areas in this proposal.</p> : null}<p role="status">{results.length} matching saints · {versionLabel}</p>{results.slice(0, 12).map(s => <button className="result" key={s.saintId} onClick={() => { setProposalId(baseline.id); if (comparisonId === baseline.id)
        setComparisonId('archived-earlier'); choose(s.caseEnvelope[0]); setQuery(''); }}><span><b>{s.name}</b><small>{s.tier} · {s.recommendedRegion}</small></span><span className="caption">{s.caseEnvelope.map(n => 'V' + n).join(', ')} <ArrowRight size={15}/></span></button>)}{!results.length ? <p>No matching saints. Try a shorter name or section.</p> : null}{results.length > 12 ? <p className="caption">Showing 12 matches. Add a name to narrow your search.</p> : null}</section> : null}
 {compare ? <details className="panel comparison" open><summary>{changed.length} vitrines have a different proposed allocation</summary><p className="caption">Comparison of research layouts, not a count of relic moves.</p><div className="change-list">{changed.map(a => <button key={a.number} onClick={() => choose(a.number)}><b>V{a.number}</b><span>{comparison.option.assignments.find(b => b.number === a.number)?.subsection}</span><ArrowRight size={15}/><span>{a.subsection}</span></button>)}</div></details> : null}
 <div className="workspace room-first linked-workspace" data-orientation={caveDirection}><div className="map-column"><Map />{lens === 'connections' ? <section className="panel connection-index"><p className="eyebrow">Placement rationale</p><h2>Connections & arrangement guidance</h2>{option.drivers.map((d, i) => <button key={i} aria-pressed={driver === i} onClick={() => { setSelected(String(d.places[0])); setDriver(i); }}><GitBranch size={17}/><span>{d.connection}<small>{d.places.map(n => 'V' + n).join(' · ')}</small></span><ArrowRight size={16}/></button>)}</section> : null}</div><SpnLinkedLocalityMap key={selected+proposalId} vitrine={selected} points={archived?[]:localitiesForSaints(data.inventory,selected)} selected={selectedPlace} onSelect={id=>setPlaceFilter(id?{vitrine:selected,proposal:proposalId,id}:null)}/><Inspector /></div>
 <details className="panel checks"><summary>Practical checks before this becomes a move plan</summary><p>{option.largeObjects.note}</p><p>{option.largeObjects.fallback}</p><ul>{option.tradeoffs.map(t => <li key={t}>{t}</li>)}</ul><p>Areas reserve space for families and sections. Confirm dimensions, source attribution, and individual relic destinations before implementation. Saint tiers are from the supplied inventory snapshot; research placements do not edit those records.</p></details>
 </section>;
}
