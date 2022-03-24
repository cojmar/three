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
		return window.performance.now() * this.time_speed
	}
	main() {
		this.objects = {}

		//sun
		this.objects.sun = this.make_planet(this.scene, {
			material: THREE.MeshBasicMaterial,
			radius: 2.5,
			texture: 'sun',
			spin: 1.5,
			fov: 10
		})
		this.objects.sun.add(new THREE.PointLight(0xffffff, 1, 200000))

		//mercury
		this.objects.mercury = this.make_planet(this.scene, {
			radius: 0.5,
			texture: 'mercury',
			orbit: [57.910 / 8, 0.8],
			spin: 2,
			fov: 2
		})

		//venus
		this.objects.venus = this.make_planet(this.scene, {
			texture: 'venus',
			orbit: [108.200 / 8, 0.4],
			spin: 1.3,
			fov: 2.5
		})

		//earth
		this.objects.earth = this.make_planet(this.scene, {
			texture: 'earth',
			orbit: [149.600 / 8, 0.2],
			spin: 2.8,
			fov: 2.6
		})
		this.camera_follow(this.objects.earth)

		//moon
		this.objects.moon = this.make_planet(this.objects.earth, {
			radius: 0.16,
			texture: 'moon',
			orbit: [3.84 / 3, 2],
			spin: 1,
			fov: 0.6
		})

		//mars
		this.objects.mars = this.make_planet(this.scene, {
			radius: 0.4,
			position: new THREE.Vector3(0, 0, -40),
			texture: 'mars',
			orbit: [227.940 / 8, 0.1],
			spin: 2.6,
			fov: 1.35
		})


		//borg
		this.objects.borg = this.make_borg(this.objects.moon, new THREE.Vector3(0.3, 0, 0))


		//Gen menu with planets
		this.init_dom()

		//inner asteroid belt
		this.objects.asteroids = this.make_asteroids(this.scene, 350 / 8, 10).update(() => {
			let time = this.time()
			time /= (Math.pow(10, 6))
			this.objects.asteroids.rotation.y += time / 1000
		})


		//stars
		this.objects.stars = this.make_starts(this.scene).update(() => {
			let time = this.time()
			time /= (Math.pow(10, 6))
			this.objects.stars.rotation.y += time / 1000
		})


	}
	camera_follow(obj) {
		obj = (typeof obj !== 'object') ? this.objects[obj] || false : obj
		if (obj) {
			this.camera_obj = obj
			if (this.camera_obj.options && this.camera_obj.options.fov) {
				this.camera.fov = this.camera_obj.options.fov
				this.camera.updateProjectionMatrix()
				if (this.controls) this.controls.update()
			}

		}
	}
	make_obj(scene) {
		let obj = new THREE.Object3D
		obj.update = (f) => {
			if (!obj.update_list) obj.update_list = []
			if (typeof f === 'function') {
				obj.update_list.push(f)
				return obj
			} else obj.update_list.map(f2 => f2(f))
		}
		if (scene) scene.add(obj)
		return obj
	}
	make_borg(scene, position) {
		let obj = this.make_obj(scene)
		let borg = new THREE.Mesh(
			new THREE.BoxGeometry(0.05, 0.05, 0.05),
			new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load('./assets/img/borg.jpg') })
		)
		obj.add(borg)
		obj.options = {
			clickable: true,
			fov: 1
		}
		if (position) obj.position.copy(position)

		obj.update(() => {

			borg.rotation.y -= 0.01
		})

		return obj
	}

	make_asteroids(scene, radius, width) {
		let obj = this.make_obj(scene)
		let addAsteroid = () => {
			let material = new THREE.MeshLambertMaterial({ color: 0x747171 })
				//material = new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load(`./assets/img/asteroid.jpg`) })


			const asteroid = new THREE.Mesh(new THREE.OctahedronGeometry(Math.random() / 10, Math.floor(Math.random() * 2)), material)
			const [x, y, z] = [
				THREE.MathUtils.randFloatSpread(2 * radius + width),
				Math.random(),
				THREE.MathUtils.randFloatSpread(2 * radius + width)
			]
			asteroid.position.set(x, y, z)
			let distance = Math.sqrt(x * x + z * z)
			let ok = (distance > (radius - width) && distance < radius)
			if (ok) obj.add(asteroid)
		}
		Array(10000).fill().map(addAsteroid)
		return obj
	}

	make_starts(scene) {
		let obj = this.make_obj(scene)
		let addStar = () => {

			const star = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 24), new THREE.MeshBasicMaterial({ color: 0x747171 }))
			const [x, y, z] = [
				THREE.MathUtils.randFloatSpread(200),
				THREE.MathUtils.randFloatSpread(200),
				THREE.MathUtils.randFloatSpread(200)
			]
			star.position.set(x, y, z)
			let ok = true
			let limit = 80
			if ((x > -1 * limit && x < limit) && (y > -1 * limit && y < limit) && (z > -1 * limit && z < limit)) ok = false


			if (ok) obj.add(star)
		}

		Array(1500).fill().map(addStar)
		return obj
	}

	make_planet(scene, options) {
		let obj = this.make_obj(scene)
		if (!options) options = {}
		options.clickable = true

		obj.options = options
		let material = options.material || THREE.MeshLambertMaterial
		let planet = new THREE.Mesh(
			new THREE.SphereGeometry(options.radius || 0.7, 64, 64),
			options.texture ? new material({ map: new THREE.TextureLoader().load(`./assets/img/${options.texture}.jpg`) }) : new material({ color: 0xffffff })
		)

		if (options.position) obj.position.copy(options.position)

		obj.add(planet)

		if (options.orbit) obj.update(() => {
			let time = this.time()
			if (typeof options.orbit !== 'object') options.orbit = [options.orbit]
			time /= (Math.pow(10, 6 - Math.abs(options.orbit[1] || 0)))
			time *= -1
			if (options.orbit[1] && options.orbit[1] < 0) time *= -1
			obj.position.x = ((options.position) ? options.position.x : 0) + Math.cos(time) * options.orbit[0]
			obj.position.z = ((options.position) ? options.position.x : 0) + Math.sin(time) * options.orbit[0]
		})

		if (options.spin) obj.update(() => {
			let time = this.time()
			time /= (Math.pow(10, 6 - Math.abs(options.spin)))
			if (options.spin < 0) time *= -1
			planet.rotation.y += time / 1000
		})
		return obj
	}

	//init
	init_dom() {
		//init menu
		document.querySelector('#menu').innerHTML = [
			Object.keys(this.objects).map(key => `<a href="#${key}"><button>${key}</button></a>`).join('&nbsp;&nbsp;'),
			`
				Speed <input type="number" id="speed" value="1" style="width:50px" step=10>
				<button id="grid">grid (off)</button>
				<button id="light">light (off)</button>
				<button id="fog">tint (off)</button>
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
		document.querySelector('#fog').onclick = (e) => {
			if (this.fog_on) {
				this.scene.fog = false
				this.fog_on = false
				e.target.innerHTML = e.target.innerHTML.replace("(on)", "(off)")
			} else {
				this.scene.fog = new THREE.FogExp2(0xdf0000, 0.005)
				this.fog_on = true
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
		this.mouseVector = new THREE.Vector3()
		window.addEventListener('mousemove', (e) => {
			this.mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1
			this.mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight)
			this.raycaster.setFromCamera(this.mouseVector, this.camera)
			const intersects = this.raycaster.intersectObjects(this.scene.children, true)
			let cursor = 'default'
			if (intersects.length) {
				let obj = intersects[0].object.parent
				if (obj.options && obj.options.clickable) cursor = 'pointer'
			}
			this.renderer.domElement.style.cursor = cursor
		})

		window.addEventListener('click', (e) => {
			this.mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1
			this.mouseVector.y = 1 - 2 * (e.clientY / window.innerHeight)
			this.raycaster.setFromCamera(this.mouseVector, this.camera)
			const intersects = this.raycaster.intersectObjects(this.scene.children, true)
			if (intersects.length) {
				let obj = intersects[0].object.parent
				if (obj.options && obj.options.clickable) this.camera_follow(obj)
			}
		})

		window.addEventListener("hashchange", () => {
			this.camera_follow(location.hash.replace('#', ''))
		})

		this.camera_follow(location.hash.replace('#', ''))

	}

	init_three() {
		this.camera = new THREE.PerspectiveCamera(2, window.innerWidth / window.innerHeight, 1, 3000)
		this.camera.position.set(0, 20, -40)

		this.scene = new THREE.Scene()

		this.camera.lookAt(200, 0, 0)

		this.scene.add(new THREE.AmbientLight(0xffffff, 0.03))

		this.light = new THREE.AmbientLight(0xffffff, 1)

		this.raycaster = new THREE.Raycaster();


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
			new THREE.AxesHelper(200, 50),
			new THREE.FogExp2(0xdf0000, 0.0007)
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