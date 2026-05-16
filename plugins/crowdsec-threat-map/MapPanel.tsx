'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { feature, mesh } from 'topojson-client'
import type { AttackPoint } from '@/lib/crowdsecMetrics'

/** world-atlas TopoJSON — Typ aus topojson-client `feature()`, kein extra npm-Paket. */
type WorldTopology = Parameters<typeof feature>[0]
import { countColor } from '@/lib/crowdsecMetrics'

interface ArcPath {
  sx: number
  sy: number
  ex: number
  ey: number
  cpx: number
  cpy: number
  col: string
  phase: number
}

interface Props {
  attackData: AttackPoint[]
  serverLat: number
  serverLon: number
  serverName: string
  linesOn: boolean
  animOn: boolean
  visible: boolean
}

export function MapPanel({ attackData, serverLat, serverLon, serverName, linesOn, animOn, visible }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    W: 400,
    H: 300,
    proj: null as d3.GeoProjection | null,
    pathGen: null as d3.GeoPath | null,
    zoomBeh: null as d3.ZoomBehavior<SVGSVGElement, unknown> | null,
    mapG: null as d3.Selection<SVGGElement, unknown, null, undefined> | null,
    dotG: null as d3.Selection<SVGGElement, unknown, null, undefined> | null,
    worldData: null as WorldTopology | null,
    arcPaths: [] as ArcPath[],
    currentScale: 1,
    currentTx: 0,
    currentTy: 0,
    fitTransform: d3.zoomIdentity,
    animRAF: 0,
    arcOffset: 0,
    lastFrame: 0,
    initialized: false,
  })

  const drawStaticArcs = useCallback(() => {
    const canvas = canvasRef.current
    const s = stateRef.current
    if (!canvas || !s.proj) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!linesOn || !s.arcPaths.length) return
    ctx.save()
    ctx.translate(s.currentTx, s.currentTy)
    ctx.scale(s.currentScale, s.currentScale)
    const ik = 1 / s.currentScale
    s.arcPaths.forEach((p) => {
      ctx.beginPath()
      ctx.strokeStyle = p.col
      ctx.lineWidth = 1 * ik
      ctx.setLineDash([5 * ik, 4 * ik])
      ctx.globalAlpha = 0.45
      ctx.moveTo(p.sx, p.sy)
      ctx.quadraticCurveTo(p.cpx, p.cpy, p.ex, p.ey)
      ctx.stroke()
    })
    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.restore()
  }, [linesOn])

  const buildArcPaths = useCallback(() => {
    const s = stateRef.current
    if (!s.proj) return
    const ptSrv = s.proj([serverLon, serverLat])
    if (!ptSrv) return
    const [sx, sy] = ptSrv
    const paths: ArcPath[] = []
    attackData.forEach((d) => {
      const pt = s.proj!([d.lon, d.lat])
      if (!pt) return
      const [px, py] = pt
      const dx = sx - px
      const dy = sy - py
      const dist = Math.sqrt(dx * dx + dy * dy)
      paths.push({
        sx: px,
        sy: py,
        ex: sx,
        ey: sy,
        cpx: (px + sx) / 2,
        cpy: (py + sy) / 2 - Math.min(dist * 0.38, 130),
        col: countColor(d.count),
        phase: Math.random() * 10,
      })
    })
    s.arcPaths = paths
  }, [attackData, serverLat, serverLon])

  const renderDots = useCallback(() => {
    const s = stateRef.current
    if (!s.proj || !s.dotG) return
    const ik = 1 / s.currentScale
    s.dotG.selectAll('.adot,.srv-dot,.srv-ring').remove()
    attackData.forEach((d) => {
      const pt = s.proj!([d.lon, d.lat])
      if (!pt) return
      const [px, py] = pt
      const sr = Math.min(3 + Math.log(d.count + 1) * 0.7, 7)
      s.dotG!
        .append('circle')
        .attr('class', 'adot')
        .attr('data-sr', String(sr))
        .attr('cx', px)
        .attr('cy', py)
        .attr('r', sr * ik)
        .attr('fill', countColor(d.count))
        .attr('stroke', 'rgba(0,0,0,0.3)')
        .attr('stroke-width', 0.4 * ik)
    })
    const ptSrv = s.proj([serverLon, serverLat])
    if (!ptSrv) return
    const [sx, sy] = ptSrv
    if (linesOn) {
      ;[20, 34, 50].forEach((r) => {
        s.dotG!
          .append('circle')
          .attr('class', 'srv-ring')
          .attr('cx', sx)
          .attr('cy', sy)
          .attr('r', r * ik)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(0,170,255,0.12)')
          .attr('stroke-width', ik)
      })
    }
    s.dotG!
      .append('circle')
      .attr('class', 'srv-dot')
      .attr('cx', sx)
      .attr('cy', sy)
      .attr('r', 7 * ik)
      .attr('fill', '#00aaff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5 * ik)
    if (serverName) {
      s.dotG!
        .append('text')
        .attr('x', sx + 12 * ik)
        .attr('y', sy + 4 * ik)
        .attr('fill', '#00aaff')
        .attr('font-size', `${7 * ik}px`)
        .attr('font-family', 'Share Tech Mono, monospace')
        .text(serverName)
    }
  }, [attackData, serverLat, serverLon, serverName, linesOn])

  const fitMapToPoints = useCallback(() => {
    const s = stateRef.current
    const svg = svgRef.current
    if (!s.proj || !svg || !attackData.length) return
    const pts = attackData.map((d) => s.proj!([d.lon, d.lat])).filter(Boolean) as [number, number][]
    const srv = s.proj([serverLon, serverLat])
    if (srv) pts.push(srv)
    if (!pts.length) return
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const pad = 40
    const k = Math.max(
      0.1,
      Math.min((s.W - pad * 2) / (Math.max(...xs) - Math.min(...xs) || 1), (s.H - pad * 2) / (Math.max(...ys) - Math.min(...ys) || 1), 6),
    )
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    s.fitTransform = d3.zoomIdentity.translate(s.W / 2 - cx * k, s.H / 2 - cy * k).scale(k)
    if (s.zoomBeh) d3.select(svg).transition().duration(600).call(s.zoomBeh.transform, s.fitTransform)
  }, [attackData, serverLat, serverLon])

  const setupProj = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const s = stateRef.current
    s.W = Math.max(wrap.clientWidth, 100)
    s.H = Math.max(wrap.clientHeight, 100)
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = s.W
      canvas.height = s.H
    }
    let base = Math.min(s.W / 6.2, s.H / 3.4)
    if (s.W < 620) base *= 1.14
    s.proj = d3.geoNaturalEarth1().scale(base).translate([s.W / 2, s.H / 2])
    s.pathGen = d3.geoPath().projection(s.proj)
  }, [])

  const drawBaseMap = useCallback(() => {
    const svg = svgRef.current
    const s = stateRef.current
    if (!svg || !s.worldData || !s.pathGen) return
    const sel = d3.select(svg)
    sel.selectAll('*').remove()
    const countries = feature(s.worldData, s.worldData.objects.countries as Parameters<typeof feature>[1])
    const borders = mesh(s.worldData, s.worldData.objects.countries as Parameters<typeof mesh>[1], (a, b) => a !== b)
    if (!countries || countries.type !== 'FeatureCollection') return
    sel.append('rect').attr('width', s.W).attr('height', s.H).attr('fill', '#020d1a')
    s.mapG = sel.append('g').attr('id', 'map-g')
    s.mapG
      .append('path')
      .datum(d3.geoGraticule()())
      .attr('d', s.pathGen)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(0,255,200,0.04)')
    s.mapG
      .selectAll('.land')
      .data(countries.features)
      .join('path')
      .attr('d', s.pathGen)
      .attr('fill', '#0a1a2e')
      .attr('stroke', 'rgba(0,255,200,0.09)')
      .attr('stroke-width', 0.4)
    s.mapG.append('path').datum(borders).attr('d', s.pathGen).attr('fill', 'none').attr('stroke', 'rgba(0,255,200,0.06)')
    s.dotG = sel.append('g').attr('id', 'dot-g')
  }, [])

  const onZoom = useCallback(
    (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      const s = stateRef.current
      const t = event.transform
      s.currentScale = t.k
      s.currentTx = t.x
      s.currentTy = t.y
      s.mapG?.attr('transform', t.toString())
      s.dotG?.attr('transform', t.toString())
      s.dotG?.selectAll('.adot').attr('r', function () {
        const sr = Number((this as SVGCircleElement).getAttribute('data-sr') || 4)
        return sr * (1 / t.k)
      })
      if (!animOn) drawStaticArcs()
    },
    [animOn, drawStaticArcs],
  )

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    ;(async () => {
      const svg = svgRef.current
      if (!svg || stateRef.current.initialized) return
      setupProj()
      try {
        const r = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        stateRef.current.worldData = (await r.json()) as WorldTopology
        if (cancelled) return
        drawBaseMap()
        const s = stateRef.current
        s.zoomBeh = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 25]).on('zoom', onZoom)
        d3.select(svg).call(s.zoomBeh)
        s.initialized = true
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visible, setupProj, drawBaseMap, onZoom])

  useEffect(() => {
    if (!visible || !stateRef.current.initialized) return
    setupProj()
    drawBaseMap()
    buildArcPaths()
    renderDots()
    fitMapToPoints()
    if (!animOn) drawStaticArcs()
  }, [visible, attackData, serverLat, serverLon, serverName, linesOn, setupProj, drawBaseMap, buildArcPaths, renderDots, fitMapToPoints, animOn, drawStaticArcs])

  useEffect(() => {
    const s = stateRef.current
    if (s.animRAF) {
      cancelAnimationFrame(s.animRAF)
      s.animRAF = 0
    }
    if (!visible || !animOn || !linesOn) {
      drawStaticArcs()
      return
    }
    const interval = 100
    function frame(ts: number) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      s.animRAF = requestAnimationFrame(frame)
      if (!linesOn) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }
      if (ts - s.lastFrame < interval) return
      s.lastFrame = ts
      s.arcOffset += 0.35
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(s.currentTx, s.currentTy)
      ctx.scale(s.currentScale, s.currentScale)
      const ik = 1 / s.currentScale
      s.arcPaths.forEach((p) => {
        ctx.beginPath()
        ctx.strokeStyle = p.col
        ctx.lineWidth = 1.1 * ik
        ctx.setLineDash([5 * ik, 4 * ik])
        ctx.lineDashOffset = -((s.arcOffset + p.phase) % 14)
        ctx.globalAlpha = 0.62
        ctx.moveTo(p.sx, p.sy)
        ctx.quadraticCurveTo(p.cpx, p.cpy, p.ex, p.ey)
        ctx.stroke()
      })
      ctx.globalAlpha = 1
      ctx.setLineDash([])
      ctx.restore()
    }
    s.animRAF = requestAnimationFrame(frame)
    return () => {
      if (s.animRAF) {
        cancelAnimationFrame(s.animRAF)
        s.animRAF = 0
      }
    }
  }, [visible, animOn, linesOn, drawStaticArcs])

  useEffect(() => {
    if (!visible) return
    const ro = new ResizeObserver(() => {
      setupProj()
      if (stateRef.current.initialized) {
        drawBaseMap()
        buildArcPaths()
        renderDots()
        if (!animOn) drawStaticArcs()
      }
    })
    const el = wrapRef.current
    if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [visible, setupProj, drawBaseMap, buildArcPaths, renderDots, animOn, drawStaticArcs])

  if (!visible) return null

  return (
    <div ref={wrapRef} className="cs-threat-map-wrap">
      <div className="cs-threat-map-title">
        <h3>
          CROWD<span>SEC</span> // THREAT MAP
        </h3>
        <span className="cs-threat-version">plugin</span>
      </div>
      <svg ref={svgRef} className="cs-threat-base-svg" />
      <canvas ref={canvasRef} className="cs-threat-arc-canvas" />
    </div>
  )
}
