export const k8sBasicsLessons = [
  {
    time: "Lesson 1",
    title: "What is Kubernetes & Why It Exists",
    concept: [
      "**The problem Kubernetes solves.** Before containers, applications were deployed on dedicated servers or VMs. Adding more servers meant calling IT, waiting days, and manually configuring each machine. Containers (Docker) fixed packaging — one image runs anywhere. But who starts 50 containers when traffic spikes? Who restarts a crashed container at 3am? Who balances load across 10 servers? That operational work is what Kubernetes automates.",
      "**Kubernetes in one sentence.** Kubernetes (K8s) is a container orchestration platform — it decides where containers run, keeps them running, scales them up and down, and connects them to each other. You describe *what* you want (3 copies of my web app, always), and Kubernetes makes it happen and keeps it that way.",
      "**The cluster model.** A Kubernetes cluster has two parts: the **Control Plane** (the brain — makes decisions) and **Worker Nodes** (the muscles — run your containers). The Control Plane runs the API Server, Scheduler, etcd (a distributed database storing all cluster state), and the Controller Manager. Worker Nodes run the `kubelet` (a local agent that carries out instructions), `kube-proxy` (networking), and your containers via a container runtime like `containerd`.",
      "**kubectl — your command-line remote control.** `kubectl` is the CLI tool you use to talk to the Kubernetes API Server. When you type `kubectl get pods`, it sends an HTTP request to the API Server, which reads state from `etcd` and returns the result. Everything in Kubernetes is done through the API — `kubectl` is just a user-friendly wrapper.",
      "**Kubernetes vs Docker.** Docker runs ONE container on ONE machine. Kubernetes runs MANY containers across MANY machines, handles failures, scales automatically, and manages networking between them. You still use Docker (or Podman) to BUILD images — Kubernetes uses those images to RUN containers at scale.",
    ],
    code: `# Install kubectl (Mac/Linux)
curl -LO "https://dl.k8s.io/release/$(curl -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Quick local cluster with kind (Kubernetes IN Docker)
brew install kind  # or: choco install kind (Windows)
kind create cluster --name my-first-cluster

# Verify the control plane is running
kubectl cluster-info
# Kubernetes control plane is running at https://127.0.0.1:XXXXX

# See the nodes in your cluster
kubectl get nodes
# NAME                          STATUS   ROLES           AGE
# my-first-cluster-control-plane   Ready    control-plane   60s

# See what's running in the cluster by default
kubectl get pods -n kube-system
# coredns (DNS), etcd, kube-apiserver, kube-scheduler...`,
    practice: "Install kind and create your first local cluster. Run `kubectl get nodes` and `kubectl get pods -n kube-system`. How many system pods are running?",
    solution: `# You should see output like:
kubectl get nodes
# NAME                             STATUS   ROLES           AGE   VERSION
# my-first-cluster-control-plane   Ready    control-plane   2m    v1.29.0

kubectl get pods -n kube-system
# NAME                                                   READY   STATUS    RESTARTS
# coredns-xxx                                            1/1     Running   0
# etcd-my-first-cluster-control-plane                    1/1     Running   0
# kube-apiserver-my-first-cluster-control-plane          1/1     Running   0
# kube-scheduler-my-first-cluster-control-plane          1/1     Running   0`,
  },
  {
    time: "Lesson 2",
    title: "Pods — The Smallest Unit in Kubernetes",
    concept: [
      "**What is a Pod?** A Pod is the smallest deployable unit in Kubernetes — NOT a container. A Pod wraps one or more containers that share the same network namespace (same IP address) and storage (volumes). Think of a Pod as a logical host for your containers. In almost all cases, you run one container per Pod.",
      "**Why not just deploy containers directly?** Kubernetes manages Pods, not containers. This abstraction lets Kubernetes group tightly coupled helpers together. For example, a web server container and a log-shipping sidecar container that reads the same log file — they go in the same Pod because they need shared storage and the same network identity.",
      "**Pod lifecycle.** Pods are ephemeral — they are born, run, and die. They are NOT restarted in place. When a Pod fails, Kubernetes creates a BRAND NEW Pod (with a new IP, new name). This is critical: never store data inside a Pod's filesystem — it disappears when the Pod dies. Persistent data must go in external storage (databases, S3, PersistentVolumes).",
      "**Pod phases.** A Pod goes through phases: `Pending` (scheduled but container not started yet — often waiting for image pull), `Running` (at least one container is running), `Succeeded` (all containers finished with exit code 0), `Failed` (at least one container exited with non-zero code), and `Unknown` (node communication lost). The `kubectl describe pod` command shows the exact events and reason for each transition.",
      "**Containers inside a Pod share networking.** All containers in a Pod share one IP address and can talk to each other via `localhost`. If you have a web server on port 8080 and a metrics exporter on port 9090 in the same Pod, the exporter can scrape `localhost:8080` directly. No service discovery needed between them.",
    ],
    code: `# Run a simple pod imperatively (quickest way to test)
kubectl run my-nginx --image=nginx:alpine --port=80

# Check its status
kubectl get pods
# NAME       READY   STATUS    RESTARTS   AGE
# my-nginx   1/1     Running   0          10s

# See full details: IP, node, events, container state
kubectl describe pod my-nginx

# Get pod IP (changes every time pod restarts!)
kubectl get pod my-nginx -o wide
# NAME       READY   STATUS    IP           NODE
# my-nginx   1/1     Running   10.244.0.5   my-cluster-worker

# Run a command INSIDE the pod container
kubectl exec -it my-nginx -- sh
# (you're now inside the container)
# wget -qO- localhost   # fetches nginx homepage

# Stream logs from the container
kubectl logs my-nginx -f

# Define a Pod using YAML (declarative — the right way)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: hello-pod
  labels:
    app: hello
spec:
  containers:
  - name: hello
    image: nginx:alpine
    ports:
    - containerPort: 80
    resources:
      requests:
        cpu: "100m"
        memory: "64Mi"
      limits:
        memory: "128Mi"
EOF`,
    practice: "Run an nginx pod imperatively. Get its IP. Exec into it and run `wget -qO- localhost`. Then delete the pod and observe that the IP is gone.",
    solution: `kubectl run my-nginx --image=nginx:alpine
kubectl get pod my-nginx -o wide        # note the IP
kubectl exec -it my-nginx -- wget -qO- localhost  # should print HTML
kubectl delete pod my-nginx
kubectl get pods   # pod is gone — ephemeral!`,
  },
  {
    time: "Lesson 3",
    title: "Deployments — Running Pods Reliably at Scale",
    concept: [
      "**Why not just run Pods directly?** If you create a Pod manually and the node it runs on crashes, the Pod is gone forever. Nobody recreates it. A **Deployment** is a controller that watches your Pods and ensures the desired number of replicas always runs. If a Pod dies, the Deployment controller immediately creates a replacement.",
      "**What a Deployment manages.** A Deployment creates and owns a **ReplicaSet**, which in turn creates and owns Pods. You never manually create ReplicaSets — the Deployment manages them for you. When you update the Deployment (e.g., new container image), it creates a NEW ReplicaSet with the new config and gradually scales it up while scaling down the old one. This is a **rolling update**.",
      "**Desired state vs. actual state.** Kubernetes is declarative. You tell it `replicas: 3` and it perpetually reconciles reality to match that. If you have 2 running pods, it starts a 3rd. If you accidentally have 4, it kills one. This reconciliation loop runs constantly. It is why Kubernetes is called 'self-healing'.",
      "**Rolling updates — zero downtime deployments.** When you update a Deployment's container image, by default Kubernetes uses a rolling strategy: it brings up new pods before removing old ones. The `maxUnavailable` (how many old pods can be down at once) and `maxSurge` (how many extra new pods can be created) parameters control the speed and safety of this process.",
      "**Rollback.** Kubernetes keeps a history of Deployment revisions. If a new image causes crashes, you can instantly rollback: `kubectl rollout undo deployment/my-app`. Kubernetes applies the previous ReplicaSet spec and your cluster returns to the last known good state in seconds.",
    ],
    code: `# Create a Deployment (declarative YAML)
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3                  # always keep 3 pods running
  selector:
    matchLabels:
      app: web-app             # manages pods with this label
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1        # at most 1 pod down during update
      maxSurge: 1              # at most 1 extra pod during update
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: nginx:1.24
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "64Mi"
          limits:
            memory: "128Mi"
EOF

# Watch the 3 pods come up
kubectl get pods -l app=web-app -w

# Simulate a rolling update (new image version)
kubectl set image deployment/web-app web=nginx:1.25

# Watch the rolling update in real time
kubectl rollout status deployment/web-app

# Check rollout history
kubectl rollout history deployment/web-app

# Rollback to previous version
kubectl rollout undo deployment/web-app`,
    practice: "Create a Deployment with 3 replicas. Manually delete one pod and observe that Kubernetes immediately creates a replacement. Then perform a rolling image update.",
    solution: `# Delete one pod — Kubernetes should recreate it
POD=$(kubectl get pods -l app=web-app -o name | head -1)
kubectl delete $POD
kubectl get pods -l app=web-app -w
# You'll see a new pod start within seconds

# Perform rolling update and watch
kubectl set image deployment/web-app web=nginx:1.25
kubectl rollout status deployment/web-app
# Waiting for deployment to finish: 1 out of 3 new replicas updated...`,
  },
  {
    time: "Lesson 4",
    title: "Services — Stable Networking for Pods",
    concept: [
      "**The Pod IP problem.** Every Pod gets a unique IP address. But Pods die and get replaced — and the new Pod gets a DIFFERENT IP. If Service A calls Service B at a specific IP, that IP breaks the next time Service B's pod restarts. You need a stable address that always points to healthy pods. That's a **Service**.",
      "**What a Service does.** A Service is a stable virtual IP (called a ClusterIP) and DNS name that load-balances traffic across a matching set of Pods. It uses a **label selector** to find its target pods. As pods come and go, the Service automatically updates its list of healthy endpoints. The stable DNS name `my-service.my-namespace.svc.cluster.local` never changes.",
      "**ClusterIP — internal only.** The default Service type. It creates a virtual IP reachable only from within the cluster. Use this for backend services (databases, APIs) that should never be exposed to the internet. Other pods reach it via `http://my-service:80` thanks to CoreDNS.",
      "**NodePort — basic external access.** Opens a port (30000–32767) on EVERY node in the cluster. Traffic to `<any-node-ip>:NodePort` is forwarded to the Service. Simple but not recommended for production — you're exposing a port on every node and the IP of nodes can change.",
      "**LoadBalancer — cloud-native external access.** In cloud environments (AWS, GCP, Azure), a LoadBalancer Service automatically provisions a cloud load balancer (like an AWS ALB/NLB) with a public DNS name. This is the standard way to expose applications to the internet. On AWS EKS, it creates an NLB by default.",
    ],
    code: `# Expose the web-app Deployment as a ClusterIP (internal)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: web-app-svc
spec:
  type: ClusterIP          # only reachable inside the cluster
  selector:
    app: web-app           # forwards to pods with this label
  ports:
  - port: 80               # Service port
    targetPort: 80         # Container port
EOF

# See the stable ClusterIP assigned
kubectl get service web-app-svc
# NAME          TYPE        CLUSTER-IP      PORT(S)   AGE
# web-app-svc   ClusterIP   10.96.45.123    80/TCP    5s

# Test from INSIDE the cluster (ClusterIP is not reachable from laptop)
kubectl run test --image=busybox --rm -it --restart=Never -- \\
  wget -qO- http://web-app-svc
# Returns nginx HTML — DNS name "web-app-svc" resolves automatically!

# Expose externally via LoadBalancer (on EKS creates an AWS NLB)
kubectl expose deployment web-app \\
  --type=LoadBalancer --port=80 --name=web-app-lb

# On a local kind cluster, use port-forward instead:
kubectl port-forward service/web-app-svc 8080:80
# Now open http://localhost:8080 in your browser`,
    practice: "Create a ClusterIP Service for your web-app Deployment. Run a test busybox pod and verify you can reach the service by DNS name. Then use port-forward to access it from your laptop.",
    solution: `# From inside the cluster:
kubectl run test --image=busybox --rm -it --restart=Never -- \\
  sh -c "wget -qO- http://web-app-svc && echo SUCCESS"

# From your laptop via port-forward:
kubectl port-forward svc/web-app-svc 8080:80 &
curl http://localhost:8080
# Should return nginx welcome page`,
  },
  {
    time: "Lesson 5",
    title: "ConfigMaps & Secrets — Externalizing Configuration",
    concept: [
      "**Why separate config from code.** A container image should be environment-agnostic. You build ONE image and deploy it to dev, staging, and prod — only the configuration differs. Baking config (DB URLs, API keys, feature flags) into the image forces a rebuild for every environment change. ConfigMaps and Secrets let you inject configuration at runtime.",
      "**ConfigMap — non-sensitive configuration.** A ConfigMap stores arbitrary key-value pairs or entire config files. You mount them into pods as environment variables or as files on the filesystem. Use ConfigMaps for: database hostnames, feature flags, log levels, Spring Boot `application.properties`, nginx.conf, etc.",
      "**Secret — sensitive configuration.** A Secret is structurally identical to a ConfigMap but is intended for sensitive data: passwords, API tokens, TLS certificates. Kubernetes base64-encodes the values (note: this is NOT encryption — it's just encoding). For real security, enable **Envelope Encryption** with a KMS key so secrets are encrypted at rest in `etcd`. On EKS, this is a one-click cluster setting.",
      "**How pods consume them.** You can inject ConfigMap/Secret values as: (1) **Environment variables** — easy but the app must restart to pick up changes. (2) **Volume mounts** — Kubernetes automatically updates mounted files when the ConfigMap changes (with a short delay), no pod restart needed. Volume mounts are preferred for config files.",
      "**Secret management best practice.** Never store Secrets in your Git repository — even base64-encoded. Use tools like AWS Secrets Manager + the Secrets Store CSI Driver (mounts secrets as files), or External Secrets Operator (syncs AWS Secrets Manager into Kubernetes Secrets automatically).",
    ],
    code: `# Create a ConfigMap from literals
kubectl create configmap app-config \\
  --from-literal=LOG_LEVEL=info \\
  --from-literal=APP_ENV=production

# Create a Secret (values auto base64-encoded)
kubectl create secret generic db-creds \\
  --from-literal=DB_USER=admin \\
  --from-literal=DB_PASS=supersecret123

# Use both in a Deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api
        image: nginx:alpine
        env:
        # From ConfigMap (non-sensitive)
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
        # From Secret (sensitive)
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-creds
              key: DB_PASS
        # Mount entire ConfigMap as a file
        volumeMounts:
        - name: config-volume
          mountPath: /etc/config
      volumes:
      - name: config-volume
        configMap:
          name: app-config
EOF

# Verify env vars are injected
kubectl exec -it $(kubectl get pod -l app=api-server -o name | head -1) \\
  -- env | grep -E "LOG_LEVEL|DB_PASSWORD"`,
    practice: "Create a ConfigMap with 3 key-value pairs and a Secret with a password. Deploy a pod that consumes both as environment variables. Exec into the pod and verify the values are present.",
    solution: `kubectl create configmap my-config --from-literal=COLOR=blue --from-literal=SIZE=large --from-literal=MODE=prod
kubectl create secret generic my-secret --from-literal=API_KEY=abc123

# Verify inside pod:
kubectl exec -it <pod-name> -- env | grep -E "COLOR|SIZE|MODE|API_KEY"
# COLOR=blue
# SIZE=large
# MODE=prod
# API_KEY=abc123`,
  },
  {
    time: "Lesson 6",
    title: "Namespaces — Organizing & Isolating Resources",
    concept: [
      "**What is a Namespace?** A Namespace is a virtual cluster within your Kubernetes cluster. It partitions resources (Pods, Services, ConfigMaps, etc.) into isolated groups. Think of it like folders on a filesystem — the same filename can exist in different folders without conflict. A pod named `api` in namespace `dev` is completely separate from a pod named `api` in namespace `prod`.",
      "**Default namespaces.** Kubernetes creates four namespaces out of the box: `default` (where your resources go if you don't specify one), `kube-system` (cluster infrastructure: coredns, kube-proxy, etc. — never put your apps here), `kube-public` (publicly readable cluster info), and `kube-node-lease` (node heartbeat leases — internal use).",
      "**Why use namespaces?** Three main reasons: (1) **Team isolation** — team-a's pods in namespace `team-a`, team-b's in `team-b`. (2) **Environment separation** — `dev`, `staging`, `prod` in the same cluster with different resource quotas. (3) **Resource quotas** — limit how much CPU and memory a namespace can consume, preventing one team from starving others.",
      "**Service DNS across namespaces.** Within the same namespace, pods reach services by short name: `http://web-svc`. Across namespaces, you must use the full DNS name: `http://web-svc.other-namespace.svc.cluster.local`. This is automatic — CoreDNS handles it.",
      "**RBAC and namespaces.** Kubernetes RBAC (Role-Based Access Control) is namespace-scoped. A developer can have full access to the `dev` namespace but read-only access (or none) to `prod`. This is the primary security boundary between teams in a shared cluster.",
    ],
    code: `# Create namespaces for different environments
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace prod

# Deploy to a specific namespace
kubectl apply -f deployment.yaml -n dev

# Always see what namespace you're in
kubectl config get-contexts
kubectl config set-context --current --namespace=dev

# Now all commands default to 'dev'
kubectl get pods    # shows pods in 'dev' only
kubectl get pods -A # shows pods in ALL namespaces

# Apply a ResourceQuota to limit namespace resources
cat <<EOF | kubectl apply -n dev -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
spec:
  hard:
    pods: "20"
    requests.cpu: "4"
    requests.memory: "8Gi"
    limits.cpu: "8"
    limits.memory: "16Gi"
EOF

# Check quota usage
kubectl describe resourcequota dev-quota -n dev

# Cross-namespace service call
# From a pod in 'dev', reach a service in 'prod':
# http://my-service.prod.svc.cluster.local`,
    practice: "Create dev and prod namespaces. Deploy the same nginx Deployment to both. Apply a ResourceQuota to dev limiting it to 5 pods. Try to scale dev to 10 pods and observe the quota rejection.",
    solution: `kubectl create namespace dev
kubectl create namespace prod
kubectl apply -f deployment.yaml -n dev
kubectl apply -f deployment.yaml -n prod

# Apply quota to dev
kubectl apply -n dev -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
spec:
  hard:
    pods: "5"
EOF

# Try to exceed quota:
kubectl scale deployment web-app --replicas=10 -n dev
kubectl get pods -n dev   # only 5 will be created, rest rejected`,
  },
  {
    time: "Lesson 7",
    title: "Resource Requests & Limits — Controlling CPU and Memory",
    concept: [
      "**Why resource management matters.** Without limits, a single runaway pod (e.g., a memory leak) can consume all node resources and crash every other pod on that node. Without requests, the Kubernetes scheduler has no basis for placing pods — it might pack 100 pods onto one node while another node sits idle.",
      "**Requests — what the scheduler uses.** `resources.requests` is the guaranteed minimum the pod needs. The scheduler uses this value to find a node with enough free capacity. If you request 500m CPU and 256Mi memory, the scheduler places the pod only on a node that has at least those resources available. Think of it as a 'reservation'.",
      "**Limits — the hard ceiling.** `resources.limits` is the maximum the container is allowed to use. If a container exceeds its memory limit, the Linux kernel **OOM-kills** it (exit code 137) and Kubernetes restarts it. If it exceeds its CPU limit, it is **throttled** (slowed down) but NOT killed. This asymmetry is important: memory OOM = crash, CPU over-limit = slow.",
      "**CPU units.** CPU is measured in millicores (m). `1000m = 1 vCPU`. `250m = 0.25 vCPU` (a quarter of a core). A typical API service might request `100m` and limit at `500m`. Node.js and Python apps are often light on CPU. Java apps can be heavy — Spring Boot typically needs at least `250m` to start without throttling.",
      "**Memory units.** Memory uses binary suffixes: `Mi` (mebibytes) and `Gi` (gibibytes). Always set memory `limits = requests` (or close to it). Unlike CPU which can be throttled, memory cannot be partially given — if the app needs more than the limit, it dies. Set limits based on real p99 usage data from your monitoring system, not guesses.",
    ],
    code: `# Pod with proper resource requests and limits
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: resource-demo
spec:
  containers:
  - name: app
    image: nginx:alpine
    resources:
      requests:
        cpu: "100m"      # scheduler: needs 0.1 vCPU free
        memory: "128Mi"  # scheduler: needs 128Mi free
      limits:
        cpu: "500m"      # max: throttled if exceeded
        memory: "256Mi"  # max: OOM killed if exceeded (exit 137)
EOF

# Check actual usage vs requests/limits
kubectl top pod resource-demo
# NAME            CPU(cores)   MEMORY(bytes)
# resource-demo   2m           8Mi

# Describe pod to see resource section
kubectl describe pod resource-demo | grep -A8 "Limits:"

# What happens with OOM (bad example - too little memory):
kubectl run oom-test --image=nginx \\
  --limits=memory=1Mi \\
  --requests=memory=1Mi
kubectl get pod oom-test
# STATUS: OOMKilled  <-- 1Mi is impossibly small for nginx

# Check exit code to confirm OOM
kubectl describe pod oom-test | grep -A3 "Last State:"
# Exit Code: 137  <-- Linux OOM kill signal`,
    practice: "Create a pod with requests of 100m CPU / 128Mi memory and limits of 500m / 256Mi. Run `kubectl top pod` to see actual usage. Then intentionally set limits too low (1Mi memory) to trigger OOMKilled.",
    solution: `# Verify resource config:
kubectl describe pod resource-demo | grep -A4 Requests
#   cpu:     100m
#   memory:  128Mi

# Verify OOM scenario:
kubectl run oom-test --image=nginx --limits=memory=1Mi --requests=memory=1Mi
kubectl get pod oom-test
# NAME       READY   STATUS      RESTARTS
# oom-test   0/1     OOMKilled   3        <-- exit code 137`,
  },
  {
    time: "Lesson 8",
    title: "Health Checks — Liveness & Readiness Probes",
    concept: [
      "**Why probes exist.** A container being `Running` doesn't mean the application inside is healthy. A Spring Boot app might be running but still initializing its database connection pool for 30 seconds. Or it might be deadlocked — the process is alive but not responding. Kubernetes probes detect these situations.",
      "**Readiness Probe — 'am I ready for traffic?'** When a readiness probe fails, Kubernetes removes the pod from the Service's endpoint list. It stops receiving requests. The pod is NOT restarted. Once the probe passes again, the pod is added back. Use this to prevent traffic from reaching a pod during startup or temporary overload.",
      "**Liveness Probe — 'am I still alive?'** When a liveness probe fails (by default 3 consecutive failures), Kubernetes kills and restarts the container. Use this for detecting true deadlocks where the app is stuck and the only fix is a restart. Be very careful: if `initialDelaySeconds` is shorter than your app's actual startup time, the liveness probe will kill your pod in an infinite restart loop.",
      "**Startup Probe — for slow-starting apps.** A third probe type for apps that take a long time to initialize (legacy Java monoliths, ML model loading). The startup probe disables the liveness and readiness probes until it passes. This prevents the liveness probe from killing a slow-starting pod. Once the startup probe passes, liveness and readiness take over.",
      "**Probe types.** Three ways to implement probes: (1) `httpGet` — makes an HTTP GET request; pass = 2xx/3xx response. Best for web apps. (2) `exec` — runs a command inside the container; pass = exit code 0. Good for databases. (3) `tcpSocket` — opens a TCP connection to a port; pass = connection succeeds. Good for non-HTTP services.",
    ],
    code: `cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthy-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: healthy-app
  template:
    metadata:
      labels:
        app: healthy-app
    spec:
      containers:
      - name: app
        image: nginx:alpine
        ports:
        - containerPort: 80
        
        # Startup probe: disable liveness/readiness until app boots
        startupProbe:
          httpGet:
            path: /
            port: 80
          failureThreshold: 30  # allow up to 30x5=150s to start
          periodSeconds: 5
          
        # Readiness: remove from load balancer if failing
        readinessProbe:
          httpGet:
            path: /           # your /health or /ready endpoint
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3   # 3 failures = stop sending traffic
          
        # Liveness: restart if truly dead
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15  # MUST be > actual startup time!
          periodSeconds: 20
          failureThreshold: 3      # 3 failures = restart container
        
        resources:
          requests:
            cpu: "100m"
            memory: "64Mi"
          limits:
            memory: "128Mi"
EOF

# Watch probe events
kubectl describe pod -l app=healthy-app | grep -A5 "Conditions:"
kubectl get events --sort-by='.lastTimestamp' | grep -i probe`,
    practice: "Deploy the healthy-app with all three probes. Then watch what happens when you change the liveness probe path to `/nonexistent` (which returns 404). Observe the pod restarting due to liveness failure.",
    solution: `# Update liveness probe to a bad path to simulate failure:
kubectl patch deployment healthy-app --type=json \\
  -p='[{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/httpGet/path","value":"/nonexistent"}]'

# Watch the pod restart loop:
kubectl get pods -l app=healthy-app -w
# NAME              READY   STATUS    RESTARTS
# healthy-app-xxx   1/1     Running   0
# healthy-app-xxx   1/1     Running   1    <-- liveness killed it!
# healthy-app-xxx   1/1     Running   2    <-- restarting again

# Check events for proof:
kubectl get events | grep -i "Liveness probe failed"`,
  },
];
