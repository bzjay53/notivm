import os
import oci
import logging
from typing import Optional, Dict, Any, List

class OCIClient:
    def __init__(self, config: Dict[str, Any]):
        """Initialize OCI client with configuration"""
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # OCI configuration
        self.region = os.getenv("OCI_REGION", "ap-seoul-1")
        self.oci_config = {
            "user": os.getenv("OCI_USER_OCID"),
            "key_file": os.getenv("OCI_PRIVATE_KEY_PATH"),
            "fingerprint": os.getenv("OCI_FINGERPRINT"),
            "tenancy": os.getenv("OCI_TENANCY_OCID"),
            "region": self.region
        }
        
        # 리전별 설정 로드
        self.region_config = self.get_region_config()
        
        # Initialize clients
        self.compute_client = oci.core.ComputeClient(self.oci_config)
        self.virtual_network_client = oci.core.VirtualNetworkClient(self.oci_config)
        self.identity_client = oci.identity.IdentityClient(self.oci_config)
        
        # Cache for resources
        self._availability_domains = None
        self._default_subnet = None
        self._compartment_id = os.getenv("VM_COMPARTMENT_OCID") or self.oci_config["tenancy"]
        
        self.logger.info(f"OCI Client initialized for region: {self.oci_config['region']}")
        if self.region_config:
            self.logger.info(f"Region config loaded: {self.region_config['description']}")
    
    def get_region_config(self) -> Optional[Dict[str, Any]]:
        """Get region-specific configuration"""
        region_configs = self.config.get("region_configs", {})
        region_config = region_configs.get(self.region)
        
        if region_config:
            self.logger.info(f"Using region-specific config for {self.region}")
            return region_config
        else:
            self.logger.warning(f"No region-specific config found for {self.region}, using defaults")
            return None
    
    def get_optimized_image_id(self) -> str:
        """Get region-optimized image ID"""
        if self.region_config and "image_id" in self.region_config:
            return self.region_config["image_id"]
        
        # Fallback to default Ubuntu 22.04 ARM image ID for the region
        default_images = {
            "us-phoenix-1": "ocid1.image.oc1.phx.aaaaaaaa2qlwy3nhlg2ddhx23j3r5fsdgrmqswz6wt37hbwqm4xhzv6nqv4q",
            "us-ashburn-1": "ocid1.image.oc1.iad.aaaaaaaa27yyzgbj4h5m4pfw5cz66y7m6dqnqvqxh7kpq3ouvzb3mvp6bjdq",
            "ap-tokyo-1": "ocid1.image.oc1.ap-tokyo-1.aaaaaaaa64kfmwuhkz2mv7ngryz6ulze5ez7j7xbhdeq4jrflipqopaq",
            "ap-osaka-1": "ocid1.image.oc1.ap-osaka-1.aaaaaaaa64kfmwuhkz2mv7ngryz6ulze5ez7j7xbhdeq4jrflipqopaq",
            "ap-singapore-1": "ocid1.image.oc1.ap-singapore-1.aaaaaaaa64kfmwuhkz2mv7ngryz6ulze5ez7j7xbhdeq4jrflipqopaq",
            "ap-seoul-1": "ocid1.image.oc1.ap-seoul-1.aaaaaaaa64kfmwuhkz2mv7ngryz6ulze5ez7j7xbhdeq4jrflipqopaq"
        }
        
        return default_images.get(self.region, default_images["ap-seoul-1"])
    
    def get_availability_domains(self) -> List[str]:
        """Get available availability domains"""
        if self._availability_domains is None:
            try:
                ads = self.identity_client.list_availability_domains(
                    compartment_id=self._compartment_id
                ).data
                self._availability_domains = [ad.name for ad in ads]
                self.logger.info(f"Found {len(self._availability_domains)} availability domains")
            except Exception as e:
                self.logger.error(f"Error fetching availability domains: {e}")
                raise
        return self._availability_domains
    
    def get_default_subnet(self) -> Optional[str]:
        """Get default subnet ID"""
        if self._default_subnet is None:
            try:
                # List VCNs
                vcns = self.virtual_network_client.list_vcns(
                    compartment_id=self._compartment_id
                ).data
                
                if not vcns:
                    self.logger.warning("No VCNs found")
                    return None
                
                # Get first VCN
                vcn = vcns[0]
                self.logger.info(f"Using VCN: {vcn.display_name}")
                
                # List subnets in the VCN
                subnets = self.virtual_network_client.list_subnets(
                    compartment_id=self._compartment_id,
                    vcn_id=vcn.id
                ).data
                
                if not subnets:
                    self.logger.warning("No subnets found in VCN")
                    return None
                
                # Get first public subnet
                for subnet in subnets:
                    if not subnet.prohibit_public_ip_on_vnic:
                        self._default_subnet = subnet.id
                        self.logger.info(f"Using subnet: {subnet.display_name}")
                        break
                
                if not self._default_subnet and subnets:
                    # If no public subnet, use first available
                    self._default_subnet = subnets[0].id
                    self.logger.info(f"Using first available subnet: {subnets[0].display_name}")
                    
            except Exception as e:
                self.logger.error(f"Error fetching default subnet: {e}")
                raise
        
        return self._default_subnet
    
    def create_instance(self, display_name: str) -> Dict[str, Any]:
        """Create a new VM instance"""
        try:
            # Get configuration
            shape = os.getenv("VM_SHAPE", "VM.Standard.A1.Flex")
            ocpus = int(os.getenv("VM_OCPUS", "2"))
            memory_gb = int(os.getenv("VM_MEMORY_GB", "12"))
            boot_volume_size = int(os.getenv("VM_BOOT_VOLUME_SIZE_GB", "50"))
            
            # Get availability domain
            availability_domains = self.get_availability_domains()
            if not availability_domains:
                raise Exception("No availability domains found")
            
            # Get subnet
            subnet_id = self.get_default_subnet()
            if not subnet_id:
                raise Exception("No suitable subnet found")
            
            # Create instance details
            instance_details = oci.core.models.LaunchInstanceDetails(
                compartment_id=self._compartment_id,
                availability_domain=availability_domains[0],
                display_name=display_name,
                shape=shape,
                shape_config=oci.core.models.LaunchInstanceShapeConfigDetails(
                    ocpus=ocpus,
                    memory_in_gbs=memory_gb
                ),
                source_details=oci.core.models.InstanceSourceViaImageDetails(
                    image_id=self.get_optimized_image_id(),
                    boot_volume_size_in_gbs=boot_volume_size
                ),
                create_vnic_details=oci.core.models.CreateVnicDetails(
                    subnet_id=subnet_id,
                    assign_public_ip=True
                )
            )
            
            self.logger.info(f"Creating instance: {display_name}")
            response = self.compute_client.launch_instance(instance_details)
            
            instance = response.data
            self.logger.info(f"Instance creation initiated: {instance.id}")
            
            return {
                "instance_id": instance.id,
                "display_name": instance.display_name,
                "lifecycle_state": instance.lifecycle_state,
                "availability_domain": instance.availability_domain,
                "shape": instance.shape,
                "time_created": instance.time_created
            }
            
        except oci.exceptions.ServiceError as e:
            self.logger.error(f"OCI Service Error: {e.message}")
            raise Exception(f"OCI Service Error: {e.message}")
        except Exception as e:
            self.logger.error(f"Error creating instance: {e}")
            raise
    
    def get_instance_details(self, instance_id: str) -> Dict[str, Any]:
        """Get instance details"""
        try:
            response = self.compute_client.get_instance(instance_id)
            instance = response.data
            
            # Get VNIC details for IP addresses
            vnic_attachments = self.compute_client.list_vnic_attachments(
                compartment_id=self._compartment_id,
                instance_id=instance_id
            ).data
            
            public_ip = None
            private_ip = None
            
            if vnic_attachments:
                vnic_id = vnic_attachments[0].vnic_id
                vnic = self.virtual_network_client.get_vnic(vnic_id).data
                public_ip = vnic.public_ip
                private_ip = vnic.private_ip
            
            return {
                "instance_id": instance.id,
                "display_name": instance.display_name,
                "lifecycle_state": instance.lifecycle_state,
                "availability_domain": instance.availability_domain,
                "shape": instance.shape,
                "time_created": instance.time_created,
                "public_ip": public_ip,
                "private_ip": private_ip
            }
            
        except Exception as e:
            self.logger.error(f"Error getting instance details: {e}")
            raise
    
    def is_instance_running(self, instance_id: str) -> bool:
        """Check if instance is in running state"""
        try:
            details = self.get_instance_details(instance_id)
            return details["lifecycle_state"] == "RUNNING"
        except Exception:
            return False
    
    def terminate_instance(self, instance_id: str) -> bool:
        """Terminate an instance"""
        try:
            self.compute_client.terminate_instance(instance_id)
            self.logger.info(f"Instance termination initiated: {instance_id}")
            return True
        except Exception as e:
            self.logger.error(f"Error terminating instance: {e}")
            return False