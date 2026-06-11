'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function makeSprite() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0,    'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  g.addColorStop(1,    'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// Soft magenta / purple bokeh, tuned to read gently on a white background.
const PALETTE = [0xc026d3, 0xd45ad9, 0xa21caf, 0xe89bf0, 0x9333ea, 0xf0abfc]

export default function AboutBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    let W = parent.offsetWidth  || window.innerWidth
    let H = parent.offsetHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    camera.position.z = 9

    const tex   = makeSprite()
    const group = new THREE.Group()
    scene.add(group)

    const COUNT = 26
    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.SpriteMaterial({
        map:         tex,
        color:       new THREE.Color(PALETTE[i % PALETTE.length]),
        transparent: true,
        opacity:     Math.random() * 0.12 + 0.08,   // 0.08–0.20: subtle on white
        depthWrite:  false,
        blending:    THREE.NormalBlending,           // normal so colour reads on white
      })
      const sp = new THREE.Sprite(mat)
      const scale = Math.random() * 2.6 + 1.0
      sp.scale.set(scale, scale, 1)
      sp.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
      )
      sp.userData = {
        phase: Math.random() * Math.PI * 2,
        baseY: sp.position.y,
        drift: Math.random() * 0.3 + 0.2,
      }
      group.add(sp)
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    function onMove(e) {
      const r = parent.getBoundingClientRect()
      mouse.tx = (e.clientX - r.left) / r.width  - 0.5
      mouse.ty = (e.clientY - r.top)  / r.height - 0.5
    }
    parent.addEventListener('mousemove', onMove)

    let raf, t = 0
    function tick() {
      raf = requestAnimationFrame(tick)
      t += 0.004
      group.rotation.y = Math.sin(t * 0.30) * 0.18
      group.rotation.x = Math.cos(t * 0.22) * 0.10
      group.children.forEach((sp) => {
        sp.position.y = sp.userData.baseY + Math.sin(t + sp.userData.phase) * sp.userData.drift
      })
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      camera.position.x =  mouse.x * 1.4
      camera.position.y = -mouse.y * 1.0
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    tick()

    function onResize() {
      W = parent.offsetWidth
      H = parent.offsetHeight
      if (!W || !H) return
      renderer.setSize(W, H)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      parent.removeEventListener('mousemove', onMove)
      renderer.dispose()
      tex.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}
