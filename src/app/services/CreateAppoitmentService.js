import { format, isBefore, parseISO, startOfHour } from 'date-fns';
import pt from 'date-fns/locale';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Notification from '../schemas/Notification';

class CreateAppoitmentService {
  async run({ date, provider_id, userId }) {
    /**
     * Check if provider_id is a provider
     */
    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkIsProvider) {
      throw new Error('You can only create appointments with providers');
    }

    /**
     * Check for past dates
     */
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      throw new Error('Past date are not permitted!');
    }

    /**
     * Check date avaivability
     */
    const checkAvaivabiliy = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvaivabiliy) {
      throw new Error('Appointment date is not available!');
    }

    const appointment = await Appointment.create({
      user_id: userId,
      provider_id,
      date,
    });

    /**
     * Notify appointment provider
     */

    const user = User.findByPk(this.userId);
    const formattedDate = format(hourStart, "dd 'de' MMM', às' H:mm'h'", {
      locale: pt,
    });

    await Notification.create({
      content: `Novo agendamento de ${user.name} para dia ${formattedDate}`,
      user: provider_id,
    });

    return appointment;
  }
}

export default new CreateAppoitmentService();
