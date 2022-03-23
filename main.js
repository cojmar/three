import * as THREE from './assets/js/three.module.js'
import { OrbitControls } from './assets/js/OrbitControls.js'

new class {
	constructor() {
		this.time_speed = 1
		this.init_three()
			.init_helpers()
			.init_controls()
			.main()
		this.render().update()
	}
	update(time = 0) {
		requestAnimationFrame((time) => this.update(time))
		Object.values(this.objects).map(obj => { if (obj.update) obj.update(time) })

		if (this.camera_obj) {
			const objectPosition = new THREE.Vector3()
			this.camera_obj.getWorldPosition(objectPosition)


			if (this.controls) {
				this.controls.target = objectPosition
				this.controls.update()
			} else
				this.camera.lookAt(...Object.values(objectPosition))
		}

		this.render()
		return this
	}
	time(set_time = false) {
		if (set_time) this.initial_time = set_time
		return window.performance.now()
	}
	main() {
		this.objects = {}
		this.objects.sun = this.make_planet(this.scene, {
			material: THREE.MeshBasicMaterial,
			radius: 2.5,
			texture: 'sun',
			spin: 1.5,
			fov: 13
		})
		this.objects.sun.add(new THREE.PointLight(0xffffff, 1, 200000))

		this.objects.mercury = this.make_planet(this.scene, {
			radius: 0.5,
			texture: 'mercury',
			orbit: [57.910 / 4, 0.8],
			spin: 2,
			fov: 2.6
		})

		this.objects.venus = this.make_planet(this.scene, {
			texture: 'venus',
			orbit: [108.200 / 4, 0.4],
			spin: 1.3,
			fov: 3
		})

		this.objects.earth = this.make_planet(this.scene, {
			texture: 'earth',
			orbit: [149.600 / 4, 0.2],
			spin: 3,
			fov: 2.5
		})

		this.objects.moon = this.make_planet(this.objects.earth, {
			radius: 0.2,
			texture: 'moon',
			orbit: [3.84 / 3, 2],
			spin: 1.6,
			fov: 0.7
		})

		this.make_starts(this.objects.sun)
		this.init_dom()
		this.camera_follow(this.objects.earth)
	}
	camera_follow(obj) {
		obj = (typeof obj !== 'object') ? this.objects[obj] || false : obj
		if (obj) {
			this.camera_obj = obj
			if (this.camera_obj.options && this.camera_obj.options.fov) {
				this.camera.fov = this.camera_obj.options.fov
				this.camera.updateProjectionMatrix()
			}

		}
	}



	make_starts(scene) {
		let addStar = () => {

			const star = new THREE.Mesh(new THREE.SphereGeometry(0.02, 24, 24), new THREE.MeshBasicMaterial({ color: 0x747171 }))
			const [x, y, z] = [
				THREE.MathUtils.randFloatSpread(200),
				THREE.MathUtils.randFloatSpread(200),
				THREE.MathUtils.randFloatSpread(200)
			]
			star.position.set(x, y, z)
			let ok = true
			let limit = 70
			if (x > -1 * limit && x < limit) ok = false


			if (ok) scene.add(star)
		}

		Array(15000).fill().map(addStar)
	}

	make_planet(scene, options) {
		let obj = new THREE.Object3D
		obj.options = options
		let material = options.material || THREE.MeshLambertMaterial
		let planet = new THREE.Mesh(
			new THREE.SphereGeometry(options.radius || 0.7, 64, 64),
			options.texture ? new material({ map: new THREE.TextureLoader().load(`./assets/img/${options.texture}.jpg`) }) : new material({ color: 0xffffff })
		)

		if (options.position) obj.position.copy(options.position)

		obj.add(planet)


		obj.update = (f) => {
			if (!obj.update_list) obj.update_list = []
			if (typeof f === 'function') obj.update_list.push(f)
			else obj.update_list.map(f2 => f2(f))
		}

		if (options.orbit) obj.update(() => {
			let time = this.time() * this.time_speed
			if (typeof options.orbit !== 'object') options.orbit = [options.orbit]
			time /= (Math.pow(10, 6 - Math.abs(options.orbit[1] || 0)))
			time *= -1
			if (options.orbit[1] && options.orbit[1] < 0) time *= -1
			obj.position.x = ((options.position) ? options.position.x : 0) + Math.cos(time) * options.orbit[0]
			obj.position.z = ((options.position) ? options.position.x : 0) + Math.sin(time) * options.orbit[0]
		})

		if (options.spin) obj.update(() => {
			let time = this.time() * this.time_speed
			time /= (Math.pow(10, 6 - Math.abs(options.spin)))
			if (options.spin < 0) time *= -1
			planet.rotation.y = time
		})

		if (scene) scene.add(obj)

		return obj
	}

	//init
	init_dom() {
		setTimeout(() => {
			//init menu
			document.querySelector('#menu').innerHTML = [
				Object.keys(this.objects).map(key => `<a href="#${key}"><button>${key}</button></a>`).join('&nbsp;&nbsp;'),
				`
				Speed <input type="number" id="speed" value="1" style="width:50px" step=10>
				<button id="grid" id="grid">grid (off)</button>
				<button id="light" id="light">light (off)</button>
				`
			].join('<br>')

			let sp_but = document.querySelector('#speed')
			sp_but.onchange = sp_but.onkeyup = () => {
				this.time_speed = sp_but.value
			}

			document.querySelector('#grid').onclick = (e) => {
				if (this.grid_on) {
					this.helpers.map(helper => this.scene.remove(helper))
					this.grid_on = false
					e.target.innerHTML = e.target.innerHTML.replace("(on)", "(off)")
				} else {
					this.helpers.map(helper => this.scene.add(helper))
					this.grid_on = true
					e.target.innerHTML = e.target.innerHTML.replace("(off)", "(on)")
				}
			}

			document.querySelector('#light').onclick = (e) => {
				if (this.light_on) {
					this.scene.remove(this.light)
					this.light_on = false
					e.target.innerHTML = e.target.innerHTML.replace("(on)", "(off)")
				} else {
					this.scene.add(this.light)
					this.light_on = true
					e.target.innerHTML = e.target.innerHTML.replace("(off)", "(on)")
				}
			}

			window.addEventListener("hashchange", () => {
				this.camera_follow(location.hash.replace('#', ''))
			})

			this.camera_follow(location.hash.replace('#', ''))
		})
	}

	init_three() {
		this.camera = new THREE.PerspectiveCamera(2, window.innerWidth / window.innerHeight, 1, 3000)
		this.camera.position.set(0, 20, -20)

		this.scene = new THREE.Scene()
		this.camera.lookAt(this.scene.position)

		this.scene.add(new THREE.AmbientLight(0xffffff, 0.03))

		this.light = new THREE.AmbientLight(0xffffff, 1)


		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(this.renderer.domElement)
		window.addEventListener('resize', () => this.on_window_resize())
		return this
	}
	on_window_resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		return this.render()
	}
	init_helpers() {
		this.helpers = [
			new THREE.GridHelper(2000, 500),
			new THREE.AxesHelper(200, 50)
		]
		return this
	}
	init_controls() {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		return this
	}
	render() {
		this.renderer.render(this.scene, this.camera)
		return this
	}
}