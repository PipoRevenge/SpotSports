import { User } from '@/src/types/user';
import { LucideIcon } from 'lucide-react-native';

// Enum para diferentes tipos de acciones en el perfil
export enum ProfileActionType {
  VIEW_OWN = 'view_own',
  VIEW_OTHER = 'view_other',
  EDIT = 'edit'
}

// Interfaz para opciones del menú
export interface MenuOption {
  key: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
}

// Enum para estados de seguimiento (si se implementa en el futuro)
export enum FollowStatus {
  NOT_FOLLOWING = 'not_following',
  FOLLOWING = 'following',
  BLOCKED = 'blocked'
}

// Props base para componentes de perfil
export interface BaseProfileProps {
  userId: string;
  actionType: ProfileActionType;
}

// Props extendidas para vista de perfil
export interface ProfileViewProps extends BaseProfileProps {
  user?: User;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

// Props para header de perfil
export interface ProfileHeaderProps {
  user: User;
  actionType: ProfileActionType;
  onEditPress?: () => void;
  onFollowPress?: () => void;
  followStatus?: FollowStatus;
  isOwn?: boolean;
  menuOptions?: MenuOption[]; // Opciones personalizadas del menú
}

// Props para componente de perfil completo
export interface ProfileProps {
  userId?: string; // Si no se proporciona, usa el usuario actual
  actionType?: ProfileActionType;
  showActions?: boolean;
  showStats?: boolean;
  // Callbacks de navegación
  onNavigateToEdit?: () => void;
  onNavigateToUser?: (userId: string) => void;
  onBack?: () => void;
}

// Datos para actualización de perfil
export interface ProfileUpdateData {
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  photoURL?: string;
  // birthDate removed - birth date is not editable for security reasons
}

// Respuesta de la API para perfil
export interface ProfileApiResponse {
  user: User;
  isOwn: boolean;
  followStatus?: FollowStatus;
}

// Estados de la feature de perfil
export interface ProfileState {
  currentUser: User | null;
  viewingUser: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  updateError: string | null;
}

// Acciones para el estado de perfil
export type ProfileAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { user: User; isOwn: boolean } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_START' }
  | { type: 'UPDATE_SUCCESS'; payload: User }
  | { type: 'UPDATE_ERROR'; payload: string }
  | { type: 'RESET' };

// Props para ProfileEdit
export interface ProfileEditProps {
  onSave?: () => void;
  onCancel?: () => void;
}

// Configuración para la feature de perfil
export interface ProfileConfig {
  enableFollowing: boolean;
  enableBlocking: boolean;
  maxBioLength: number;
  allowedImageTypes: string[];
  maxImageSize: number;
}